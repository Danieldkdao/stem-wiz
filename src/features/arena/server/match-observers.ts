import { db } from "@/db/db";
import { ArenaWebSocket, ServerMessage } from "../lib/types";
import { getArenaWsState, sendToUser } from "./connection-state";
import { and, eq } from "drizzle-orm";
import { MatchTable, UserMatchTable } from "@/db/schema";

export const connectToObservers = (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, usersInObservingRoom } = getArenaWsState();

  const userId = ws.user.id;

  if (usersInWaitingRoom.has(userId)) usersInWaitingRoom.delete(userId);
  if (usersInObservingRoom.has(userId)) return;

  usersInObservingRoom.add(userId);
};

export const broadcastToMatchObservers = async (
  matchId: string,
  message: ServerMessage,
) => {
  const { activeObserversByUser } = getArenaWsState();

  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
  });

  if (!existingMatch) return;

  const activeObserversInMatch = activeObserversByUser
    .entries()
    .filter(([_, value]) => {
      return value === matchId;
    })
    .toArray();

  activeObserversInMatch.forEach(([observer]) => {
    sendToUser(observer, message);
  });
};

export const confirmMatchParticipant = async (
  userId: string,
  matchId: string,
) => {
  const isMatchParticipant = await db.query.UserMatchTable.findFirst({
    where: and(
      eq(UserMatchTable.userId, userId),
      eq(UserMatchTable.matchId, matchId),
    ),
  });
  if (!isMatchParticipant) {
    sendToUser(userId, {
      type: "error",
      message: "You are not a participant in this match.",
    });
  }
};

export const broadcastUpdatedMatchObserverCount = async (userId: string) => {
  const { activeObserversByUser } = getArenaWsState();
  const matchId = activeObserversByUser.get(userId);
  if (!matchId) return;

  const activeObserversInMatch = activeObserversByUser
    .entries()
    .filter(([_, value]) => {
      return value === matchId;
    })
    .toArray();

  await broadcastToMatchObservers(matchId, {
    type: "match_observer_count_updated",
    newCount: activeObserversInMatch.length,
  });
};

export const broadcastCodeSnapshot = async (
  ws: ArenaWebSocket,
  matchId: string,
  code: string,
) => {
  const userId = ws.user.id;

  await confirmMatchParticipant(userId, matchId);

  await broadcastToMatchObservers(matchId, {
    type: "observer_code_snapshot",
    userId,
    code,
  });
};

export const broadcastCodeOutput = async (
  ws: ArenaWebSocket,
  matchId: string,
  output?: string | null,
  error?: string | null,
) => {
  const userId = ws.user.id;

  await confirmMatchParticipant(userId, matchId);

  await broadcastToMatchObservers(matchId, {
    type: "observer_code_output",
    userId,
    output,
    error,
  });
};

export const broadcastRunningCode = async (
  ws: ArenaWebSocket,
  matchId: string,
) => {
  const userId = ws.user.id;

  await confirmMatchParticipant(userId, matchId);

  await broadcastToMatchObservers(matchId, {
    type: "observer_running_code",
    userId,
  });
};

export const subscribeObserverMatch = async (
  ws: ArenaWebSocket,
  matchId: string,
) => {
  const { usersInWaitingRoom, usersInObservingRoom, activeObserversByUser } =
    getArenaWsState();

  const userId = ws.user.id;

  const userIsParticipating = await db.query.UserMatchTable.findFirst({
    where: and(
      eq(UserMatchTable.userId, userId),
      eq(UserMatchTable.matchId, matchId),
    ),
  });
  if (userIsParticipating) {
    sendToUser(userId, {
      type: "connection_error",
      message: "You cannot subscribe to a match you are participating in.",
    });
    return;
  }

  if (usersInWaitingRoom.has(userId)) usersInWaitingRoom.delete(userId);
  activeObserversByUser.delete(userId);
  usersInObservingRoom.delete(userId);
  activeObserversByUser.set(userId, matchId);
  await broadcastUpdatedMatchObserverCount(userId);
};
