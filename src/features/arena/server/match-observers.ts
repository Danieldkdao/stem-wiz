import { db } from "@/db/db";
import { MatchObserverTable, MatchTable, UserMatchTable } from "@/db/schema";
import { RealtimeWebSocket } from "@/features/realtime/lib/types";
import {
  sendToConnection,
  sendToUser,
} from "@/features/realtime/server/connection-state";
import { and, eq } from "drizzle-orm";
import { ArenaServerMessage } from "../lib/types";
import { cleanupUserConnection, getArenaWsState } from "./connection-state";

export const connectToObservers = (ws: RealtimeWebSocket) => {
  const { usersInWaitingRoom, usersInObservingRoom } = getArenaWsState();

  const userId = ws.user.id;

  if (usersInWaitingRoom.has(userId)) usersInWaitingRoom.delete(userId);
  if (usersInObservingRoom.has(userId)) return;

  usersInObservingRoom.add(userId);
};

export const broadcastToMatchObservers = async (
  matchId: string,
  message: ArenaServerMessage,
) => {
  const { activeObserversByUser } = getArenaWsState();

  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
  });

  if (!existingMatch) return;

  const activeObserversInMatch = [...activeObserversByUser.values()].filter(
    (observer) => observer.matchId === matchId,
  );

  activeObserversInMatch.forEach((observer) => {
    sendToConnection(observer.connectionId, message);
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

export const broadcastUpdatedMatchObserverCount = async (
  userId: string,
  matchId?: string,
) => {
  const { activeObserversByUser } = getArenaWsState();

  let currentMatchId = matchId;

  if (!currentMatchId) {
    currentMatchId = activeObserversByUser.get(userId)?.matchId;
    if (!currentMatchId) return;
  }

  const activeObserversInMatch = [...activeObserversByUser.values()].filter(
    (observer) => observer.matchId === currentMatchId,
  );

  await broadcastToMatchObservers(currentMatchId, {
    type: "match_observer_count_updated",
    newCount: activeObserversInMatch.length,
    matchId: currentMatchId,
  });
};

export const broadcastCodeSnapshot = async (
  ws: RealtimeWebSocket,
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
  ws: RealtimeWebSocket,
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
  ws: RealtimeWebSocket,
  matchId: string,
) => {
  const userId = ws.user.id;

  await confirmMatchParticipant(userId, matchId);

  await broadcastToMatchObservers(matchId, {
    type: "observer_running_code",
    userId,
  });
};

export const broadcastUserSubmittedCode = async (
  ws: RealtimeWebSocket,
  matchId: string,
) => {
  const userId = ws.user.id;

  await confirmMatchParticipant(userId, matchId);

  await broadcastToMatchObservers(matchId, {
    type: "user_submitted_code",
    userId,
  });
};

export const subscribeObserverMatch = async (
  ws: RealtimeWebSocket,
  matchId: string,
) => {
  const {
    usersInWaitingRoom,
    usersInObservingRoom,
    activeObserversByUser,
    activeMatchesByUser,
  } = getArenaWsState();

  const connectionId = ws.id;
  const userId = ws.user.id;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
  });
  if (!existingMatch) {
    sendToConnection(connectionId, {
      type: "connection_error",
      message: "Match not found.",
    });
    return;
  }

  const userIsParticipating = await db.query.UserMatchTable.findFirst({
    where: and(
      eq(UserMatchTable.userId, userId),
      eq(UserMatchTable.matchId, existingMatch.id),
    ),
  });
  if (userIsParticipating) {
    sendToConnection(connectionId, {
      type: "connection_error",
      message: "You cannot subscribe to a match you are participating in.",
    });
    return;
  }
  const hasPermission = await db.query.MatchObserverTable.findFirst({
    where: and(
      eq(MatchObserverTable.userId, userId),
      eq(MatchObserverTable.matchId, existingMatch.id),
    ),
  });
  if (existingMatch.kind === "friend_challenge" && !hasPermission) {
    sendToConnection(connectionId, {
      type: "connection_error",
      message: "You do not have permission to observe this match.",
    });
    return;
  }

  const matchUsers = await db
    .select()
    .from(UserMatchTable)
    .where(eq(UserMatchTable.matchId, matchId));

  if (usersInWaitingRoom.has(userId)) usersInWaitingRoom.delete(userId);
  activeObserversByUser.delete(userId);
  usersInObservingRoom.delete(userId);
  activeObserversByUser.set(userId, {
    matchId,
    connectionId: ws.id,
  });
  await broadcastUpdatedMatchObserverCount(userId);
  sendToUser(userId, {
    type: "users_connection_statuses",
    users: matchUsers.map((user) => {
      const activeUser = activeMatchesByUser.get(user.userId);

      return {
        userId: user.userId,
        isConnected: activeUser ? activeUser.isConnected : false,
      };
    }),
  });
};

export const leaveObserverMatch = async (
  ws: RealtimeWebSocket,
  matchId: string,
) => {
  const { activeObserversByUser } = getArenaWsState();

  const userId = ws.user.id;

  if (activeObserversByUser.get(userId)?.matchId !== matchId) {
    sendToConnection(ws.id, {
      type: "error",
      message: "You cannot leave a match you are not observing.",
    });
    return;
  }

  cleanupUserConnection(userId);
  broadcastUpdatedMatchObserverCount(userId, matchId);
};
