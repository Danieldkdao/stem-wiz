import { db } from "@/db/db";
import { MatchTable } from "@/db/schema";
import { upsertMatchResult } from "@/features/matches/server/match-results";
import {
  sendToConnection,
  sendToUser,
} from "@/features/realtime/server/connection-state";
import { generateMatchResults } from "@/services/ai/matches";
import { and, eq, gt } from "drizzle-orm";
import { ArenaWebSocket } from "../lib/types";
import {
  cleanupUserConnection,
  getArenaWsState,
  getOpponentConnectionId,
} from "./connection-state";
import { broadcastToMatchObservers } from "./match-observers";

export const connectToMatch = async (ws: ArenaWebSocket, matchId: string) => {
  const { usersInWaitingRoom, activeMatchesByUser } = getArenaWsState();

  const userId = ws.user.id;
  console.log("[arena:connect_to_match] requested", {
    userId,
    connectionId: ws.id,
    matchId,
    activeMatchState: activeMatchesByUser.get(userId),
    waitingRoomConnectionId: usersInWaitingRoom.get(userId)?.connectionId,
  });

  const userInWaitingRoom = usersInWaitingRoom.get(userId);

  if (userInWaitingRoom) {
    console.log("[arena:connect_to_match] removing user from waiting room", {
      userId,
      waitingRoomConnectionId: userInWaitingRoom.connectionId,
      matchConnectionId: ws.id,
      matchId,
    });
    usersInWaitingRoom.delete(userId);
  }

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      gt(MatchTable.expiresAt, new Date()),
    ),
    with: {
      users: true,
    },
  });

  if (!existingMatch) {
    cleanupUserConnection(userId);
    return;
  }

  const currentMatchUser = existingMatch.users.find(
    (user) => user.userId === userId,
  );

  if (!currentMatchUser) {
    console.log("[arena:connect_to_match] rejected: no valid active DB match", {
      userId,
      connectionId: ws.id,
      matchId,
    });
    cleanupUserConnection(userId);
    // todo: maybe terminate socket later?
    return;
  }

  existingMatch.users.forEach((matchUser) => {
    const existingPresence = activeMatchesByUser.get(matchUser.userId);

    if (!existingPresence) {
      activeMatchesByUser.set(matchUser.userId, {
        matchId: existingMatch.id,
        isConnected: false,
        connectionId: null,
      });
    }
  });

  console.log("[arena:connect_to_match] DB match confirmed", {
    userId,
    connectionId: ws.id,
    matchId: currentMatchUser.matchId,
  });

  const opponent = existingMatch.users.find(
    (matchUser) => matchUser.userId !== userId,
  );

  if (!opponent) {
    console.log(
      "[arena:connect_to_match] notifying current user opponent left",
      {
        userId,
        connectionId: ws.id,
        matchId,
      },
    );
    sendToConnection(ws.id, { type: "opponent_left_match" });
  }

  const hasActiveInMap = activeMatchesByUser.get(userId);
  console.log("[arena:connect_to_match] current arena state before update", {
    userId,
    connectionId: ws.id,
    matchId,
    activeState: hasActiveInMap,
  });

  activeMatchesByUser.set(currentMatchUser.userId, {
    matchId: currentMatchUser.matchId,
    isConnected: true,
    connectionId: ws.id,
  });

  const opponentConnectionId = getOpponentConnectionId(userId);
  console.log("[arena:connect_to_match] opponent connection lookup", {
    userId,
    connectionId: ws.id,
    matchId,
    opponentConnectionId,
  });

  if (opponentConnectionId) {
    sendToConnection(opponentConnectionId, { type: "opponent_joined_match" });
    console.log("[arena:connect_to_match] opponent_joined_match sent", {
      userId,
      matchId,
      opponentConnectionId,
    });
  }

  broadcastToMatchObservers(matchId, {
    type: "users_connection_statuses",
    users: [{ userId, isConnected: true }],
  });
  console.log("[arena:connect_to_match] observer connection status broadcast", {
    userId,
    connectionId: ws.id,
    matchId,
    isConnected: true,
  });

  console.log("[arena:connect_to_match] completed", {
    userId,
    connectionId: ws.id,
    matchId,
    activeMatchState: activeMatchesByUser.get(userId),
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
