import { db } from "@/db/db";
import { MatchResultReasonType, MatchTable } from "@/db/schema";
import { RealtimeWebSocket } from "@/features/realtime/lib/types";
import {
  sendToConnection,
  sendToUser,
} from "@/features/realtime/server/connection-state";
import { generateMatchResults } from "@/services/ai/matches";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import {
  cleanupUserConnection,
  getArenaWsState,
  getOpponentConnectionId,
} from "./connection-state";
import { finalizeMatch } from "./finalize-match";
import { broadcastToMatchObservers } from "./match-observers";

const activeMatchExpirationQuery = () =>
  or(isNull(MatchTable.expiresAt), gt(MatchTable.expiresAt, new Date()));

export const connectToMatch = async (
  ws: RealtimeWebSocket,
  matchId: string,
) => {
  const { usersInWaitingRoom, activeMatchesByUser } = getArenaWsState();

  const userId = ws.user.id;
  const userInWaitingRoom = usersInWaitingRoom.get(userId);

  if (userInWaitingRoom) {
    usersInWaitingRoom.delete(userId);
  }

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      activeMatchExpirationQuery(),
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

  const opponent = existingMatch.users.find(
    (matchUser) => matchUser.userId !== userId,
  );

  if (!opponent || !activeMatchesByUser.get(opponent.userId)?.isConnected) {
    sendToConnection(ws.id, { type: "opponent_left_match" });
  }

  activeMatchesByUser.set(currentMatchUser.userId, {
    matchId: currentMatchUser.matchId,
    isConnected: true,
    connectionId: ws.id,
  });

  const opponentConnectionId = getOpponentConnectionId(userId);

  if (opponentConnectionId) {
    sendToConnection(opponentConnectionId, { type: "opponent_joined_match" });
  }

  broadcastToMatchObservers(matchId, {
    type: "users_connection_statuses",
    users: [{ userId, isConnected: true }],
  });
};

export const disconnectFromMatch = async (
  ws: RealtimeWebSocket,
  matchId: string,
) => {
  const { activeMatchesByUser } = getArenaWsState();

  const userId = ws.user.id;
  const connectionId = ws.id;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      activeMatchExpirationQuery(),
    ),
    with: {
      users: true,
    },
  });

  if (!existingMatch) {
    sendToConnection(connectionId, {
      type: "error",
      message: "Match not found.",
    });
    return;
  }

  const currentMatchUser = existingMatch.users.find(
    (user) => user.userId === userId,
  );

  if (!currentMatchUser) {
    sendToConnection(connectionId, {
      type: "error",
      message: "You are not a participant in this match.",
    });
    return;
  }

  const opponentConnectionId = getOpponentConnectionId(userId);
  if (opponentConnectionId) {
    sendToConnection(opponentConnectionId, {
      type: "opponent_left_match",
    });
  }

  activeMatchesByUser.set(currentMatchUser.userId, {
    matchId: currentMatchUser.matchId,
    isConnected: false,
    connectionId: null,
  });

  broadcastToMatchObservers(matchId, {
    type: "users_connection_statuses",
    users: [{ userId, isConnected: false }],
  });

  cleanupUserConnection(userId);
};

export const broadcastCodeSubmission = async (
  ws: RealtimeWebSocket,
  matchId: string,
) => {
  const { activeMatchesByUser } = getArenaWsState();

  const userId = ws.user.id;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      activeMatchExpirationQuery(),
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
      activeMatchExpirationQuery(),
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

  const finalizedMatch = await finalizeMatch({
    matchId: existingMatch.id,
    reason: "traditional",
    winnerId: winnerId === "none" ? null : winnerId,
  });

  if (!finalizedMatch) {
    const [recheckMatch] = await db
      .select()
      .from(MatchTable)
      .where(eq(MatchTable.id, existingMatch.id));

    if (recheckMatch?.status === "finished") return;

    latestMatch.users.forEach((user) => {
      sendToUser(user.userId, {
        type: "error",
        message: "Failed to generate match results.",
      });
    });
  }
};

export const finishMatchFromSocket = async (
  ws: RealtimeWebSocket,
  matchId: string,
  reason: MatchResultReasonType,
) => {
  const userId = ws.user.id;
  const connectionId = ws.id;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
    with: {
      users: true,
      submissions: true,
    },
  });

  if (!existingMatch) {
    sendToConnection(connectionId, {
      type: "error",
      message: "Match not found.",
    });
    return;
  }

  if (existingMatch.status === "finished") return;

  const existingParticipant = existingMatch.users.find(
    (user) => user.userId === userId,
  );
  if (!existingParticipant) {
    sendToConnection(connectionId, {
      type: "error",
      message: "You are not a participant in this match.",
    });
    return;
  }

  const opponent = existingMatch.users.find((user) => user.userId !== userId);
  if (!opponent) {
    sendToConnection(connectionId, {
      type: "error",
      message: "We couldn't find an opponent for this match.",
    });
    return;
  }

  const isExpired =
    existingMatch.expiresAt !== null && existingMatch.expiresAt <= new Date();
  if (reason === "timeout" && !isExpired) {
    sendToConnection(connectionId, {
      type: "error",
      message: "This match is still in progress.",
    });
    return;
  }

  if (reason !== "timeout" && isExpired) {
    sendToConnection(connectionId, {
      type: "error",
      message: "This match has already ended.",
    });
    return;
  }

  let winnerId: string | null = null;

  switch (reason) {
    case "user_quit":
      winnerId = opponent.userId;
      break;
    case "user_lost_connection":
      winnerId = userId;
      break;
    case "timeout":
      const hasSubmission = existingMatch.submissions.length > 0;

      if (hasSubmission) {
        const generatedWinnerId = await generateMatchResults(existingMatch.id);
        winnerId = generatedWinnerId === "none" ? null : generatedWinnerId;
      }
      break;
    case "traditional":
      const submittedUserIds = new Set(
        existingMatch.submissions.map((submission) => submission.userId),
      );
      const allUsersSubmitted = existingMatch.users.every((user) =>
        submittedUserIds.has(user.userId),
      );
      if (!allUsersSubmitted) {
        sendToConnection(connectionId, {
          type: "error",
          message:
            "Both users must submit a solution before the match can finish.",
        });
        return;
      }

      const generatedWinnerId = await generateMatchResults(existingMatch.id);
      winnerId = generatedWinnerId === "none" ? null : generatedWinnerId;
      break;
    default:
      reason satisfies never;
  }

  const finalizedMatch = await finalizeMatch({
    matchId: existingMatch.id,
    reason,
    winnerId,
  });
  if (!finalizedMatch) {
    const [recheckMatch] = await db
      .select({ status: MatchTable.status })
      .from(MatchTable)
      .where(eq(MatchTable.id, existingMatch.id))
      .limit(1);

    if (recheckMatch?.status === "finished") return;

    sendToConnection(connectionId, {
      type: "error",
      message: "Failed to finish match.",
    });
  }
};
