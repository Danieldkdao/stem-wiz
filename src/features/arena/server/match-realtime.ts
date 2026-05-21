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

export const connectToMatch = async (ws: ArenaWebSocket, matchId: string) => {
  const {
    usersInWaitingRoom,
    activeMatchesByUser,
    pendingConnectionCleanupByUser,
  } = getArenaWsState();

  const userId = ws.user.id;
  console.log("[arena:connect_to_match] start", {
    userId,
    matchId,
    connectionId: ws.id,
  });

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
    console.log("[arena:connect_to_match] no active match found", {
      userId,
      matchId,
      connectionId: ws.id,
    });
    cleanupUserConnection(userId);
    // todo: maybe terminate socket later?
    return;
  }

  const userInWaitingRoom = usersInWaitingRoom.get(userId);

  const pendingCleanup = pendingConnectionCleanupByUser.get(userId);
  if (pendingCleanup) {
    clearTimeout(pendingCleanup);
    pendingConnectionCleanupByUser.delete(userId);
    console.log("[arena:connect_to_match] cleared pending connection cleanup", {
      userId,
      matchId,
      connectionId: ws.id,
    });
  }

  if (userInWaitingRoom) {
    console.log("[arena:connect_to_match] removing user from waiting room", {
      userId,
      waitingRoomConnectionId: userInWaitingRoom.connectionId,
      matchConnectionId: ws.id,
    });
    usersInWaitingRoom.delete(userId);
  }

  const opponent = [...activeMatchesByUser.entries()].find(
    ([otherUserId, otherMatchId]) =>
      otherUserId !== userId && otherMatchId.matchId === matchId,
  );

  console.log("[arena:connect_to_match] opponent state", {
    userId,
    matchId,
    opponentUserId: opponent?.[0],
    opponentMatchState: opponent?.[1],
  });

  if (!opponent) {
    console.log("[arena:connect_to_match] opponent missing from arena state", {
      userId,
      matchId,
      connectionId: ws.id,
    });
    sendToConnection(ws.id, { type: "opponent_left_match" });
  } else if (!opponent[1].isConnected) {
    console.log("[arena:connect_to_match] opponent matched but not connected", {
      userId,
      matchId,
      opponentUserId: opponent[0],
      opponentConnectionId: opponent[1].connectionId,
    });
  }

  const hasActiveInMap = activeMatchesByUser.get(userId);
  console.log("[arena:connect_to_match] current user arena state", {
    userId,
    matchId,
    activeState: hasActiveInMap,
  });

  if (!hasActiveInMap || !hasActiveInMap.isConnected) {
    activeMatchesByUser.set(activeUserMatch.userId, {
      matchId: activeUserMatch.matchId,
      isConnected: true,
      connectionId: ws.id,
    });
    console.log("[arena:connect_to_match] marked user connected", {
      userId,
      matchId: activeUserMatch.matchId,
      connectionId: ws.id,
    });
  }

  const opponentConnectionId = getOpponentConnectionId(userId);
  console.log("[arena:connect_to_match] opponent connection lookup", {
    userId,
    matchId,
    opponentConnectionId,
  });

  if (opponentConnectionId) {
    console.log("[arena:connect_to_match] notifying opponent joined", {
      userId,
      matchId,
      opponentConnectionId,
    });
    sendToConnection(opponentConnectionId, { type: "opponent_joined_match" });
  }

  console.log("[arena:connect_to_match] broadcasting observer status", {
    userId,
    matchId,
    isConnected: true,
  });
  broadcastToMatchObservers(matchId, {
    type: "users_connection_statuses",
    users: [{ userId, isConnected: true }],
  });

  console.log("[arena:connect_to_match] complete", {
    userId,
    matchId,
    connectionId: ws.id,
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

  const response = await generateMatchResults(latestMatch.id);

  if (!response) {
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
