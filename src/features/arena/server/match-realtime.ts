import { db } from "@/db/db";
import { MatchTable, UserMatchTable } from "@/db/schema";
import { and, eq, getTableColumns, gt } from "drizzle-orm";
import { ArenaWebSocket } from "../lib/types";
import {
  cleanupUserConnection,
  getArenaWsState,
  getOpponentConnectionId,
} from "./connection-state";
import { generateMatchResults } from "@/services/ai/matches";
import { broadcastToMatchObservers } from "./match-observers";
import {
  sendToConnection,
  sendToUser,
} from "@/features/realtime/server/connection-state";
import { upsertMatchResult } from "@/features/matches/server/match-results";

export const connectToMatch = async (ws: ArenaWebSocket, matchId: string) => {
  const { usersInWaitingRoom, activeMatchesByUser } = getArenaWsState();

  const userId = ws.user.id;

  const [activeUserMatch] = await db
    .select({
      ...getTableColumns(UserMatchTable),
    })
    .from(UserMatchTable)
    .innerJoin(MatchTable, eq(MatchTable.id, UserMatchTable.matchId))
    .where(
      and(
        eq(UserMatchTable.userId, userId),
        eq(UserMatchTable.matchId, matchId),
        eq(MatchTable.status, "in-progress"),
        gt(MatchTable.expiresAt, new Date()),
      ),
    );

  if (!activeUserMatch) {
    cleanupUserConnection(userId);
    // todo: maybe terminate socket later?
    return;
  }

  const userInWaitingRoom = usersInWaitingRoom.get(userId);

  if (userInWaitingRoom) {
    usersInWaitingRoom.delete(userId);
  }

  const opponent = [...activeMatchesByUser.entries()].find(
    ([otherUserId, otherMatchId]) =>
      otherUserId !== userId && otherMatchId.matchId === matchId,
  );

  if (!opponent) {
    sendToConnection(ws.id, { type: "opponent_left_match" });
  }

  const hasActiveInMap = activeMatchesByUser.get(userId);

  if (!hasActiveInMap || !hasActiveInMap.isConnected) {
    activeMatchesByUser.set(activeUserMatch.userId, {
      matchId: activeUserMatch.matchId,
      isConnected: true,
      connectionId: ws.id,
    });
  }

  const opponentConnectionId = getOpponentConnectionId(userId);

  if (opponentConnectionId) {
    sendToConnection(opponentConnectionId, { type: "opponent_joined_match" });
  }

  broadcastToMatchObservers(matchId, {
    type: "users_connection_statuses",
    users: [{ userId, isConnected: true }],
  });
};

export const broadcastCodeSubmission = async (
  ws: ArenaWebSocket,
  matchId: string,
) => {
  const { activeMatchesByUser, usersInObservingRoom } = getArenaWsState();

  const userId = ws.user.id;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      gt(MatchTable.expiresAt, new Date()),
    ),
    with: {
      users: true,
      submissions: true,
      result: true,
    },
  });

  if (!existingMatch) {
    cleanupUserConnection(userId);
    // todo: maybe terminate socket later?
    return;
  }

  const activeUserMatch = existingMatch.users.find(
    (user) => user.userId === userId,
  );

  if (!activeUserMatch) {
    cleanupUserConnection(userId);
    // todo: maybe terminate socket later?
    return;
  }

  const hasActiveInMap = activeMatchesByUser.get(userId);
  if (!hasActiveInMap) {
    console.error("No active match for user.");
    sendToConnection(ws.id, {
      type: "error",
      message: "No active match for user found.",
    });
    return;
  }

  const opponentConnectionId = getOpponentConnectionId(userId);

  if (opponentConnectionId) {
    sendToConnection(opponentConnectionId, { type: "opponent_submitted_code" });
  }
  broadcastToMatchObservers(existingMatch.id, {
    type: "user_submitted_code",
    userId,
  });

  const latestMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      gt(MatchTable.expiresAt, new Date()),
    ),
    with: {
      users: true,
      submissions: true,
      result: true,
    },
  });

  if (!latestMatch) return;

  const submittedUserIds = new Set(
    latestMatch.submissions.map((submission) => submission.userId),
  );
  const allUsersSubmitted = latestMatch.users.every((user) =>
    submittedUserIds.has(user.userId),
  );

  if (!allUsersSubmitted) return;

  const winnerId = await generateMatchResults(latestMatch.id);

  if (!winnerId) {
    latestMatch.users.forEach((user) => {
      sendToUser(user.userId, {
        type: "error",
        message: "Failed to generate match results.",
      });
    });
    return;
  }

  const upsertedResult = await upsertMatchResult({
    matchId: existingMatch.id,
    result: "completed",
    winnerId: winnerId === "none" ? null : winnerId,
    reason: "traditional",
  });

  if (!upsertedResult) {
    latestMatch.users.forEach((user) => {
      sendToUser(user.userId, {
        type: "error",
        message: "Failed to generate match results.",
      });
    });
    return;
  }

  latestMatch.users.forEach((user) => {
    sendToUser(user.userId, { type: "match_finished", reason: "traditional" });
  });
  await broadcastToMatchObservers(latestMatch.id, {
    type: "match_finished",
    reason: "traditional",
  });
  usersInObservingRoom.forEach((userId) => {
    sendToUser(userId, { type: "observable_match_count_updated" });
  });
};
