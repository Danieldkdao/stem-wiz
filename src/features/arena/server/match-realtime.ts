import { db } from "@/db/db";
import { MatchTable, UserMatchTable } from "@/db/schema";
import { and, eq, getTableColumns, gt } from "drizzle-orm";
import { ArenaWebSocket } from "../lib/types";
import {
  cleanupUserConnection,
  getArenaWsState,
  sendToUser,
} from "./connection-state";

export const connectToMatch = async (ws: ArenaWebSocket, matchId: string) => {
  const { usersInWaitingRoom, activeMatchesByUser } = getArenaWsState();

  const userId = ws.user.id;

  console.log("[match-realtime] connect_to_match received", {
    userId,
    matchId,
    waitingRoomSize: usersInWaitingRoom.size,
    activeMatchesSize: activeMatchesByUser.size,
  });

  console.log("[match-realtime] validating active match access", {
    userId,
    matchId,
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

  console.log("[match-realtime] active match query result", {
    userId,
    matchId,
    found: Boolean(activeUserMatch),
    activeUserMatch,
  });

  if (!activeUserMatch) {
    console.log("[match-realtime] no active match found, terminating socket", {
      userId,
      matchId,
    });
    cleanupUserConnection(userId);
    // todo: maybe terminate socket later?
    return;
  }

  const userInWaitingRoom = usersInWaitingRoom.get(userId);
  console.log("[match-realtime] waiting room lookup", {
    userId,
    matchId,
    wasInWaitingRoom: Boolean(userInWaitingRoom),
  });

  if (userInWaitingRoom) {
    usersInWaitingRoom.delete(userId);
    console.log("[match-realtime] removed user from waiting room", {
      userId,
      matchId,
      waitingRoomSize: usersInWaitingRoom.size,
    });
  }

  console.log("[match-realtime] searching active map for opponent", {
    userId,
    matchId,
    activeMatches: [...activeMatchesByUser.entries()],
  });

  const opponent = [...activeMatchesByUser.entries()].find(
    ([otherUserId, otherMatchId]) =>
      otherUserId !== userId && otherMatchId.matchId === matchId,
  );

  console.log("[match-realtime] opponent lookup result", {
    userId,
    matchId,
    opponentUserId: opponent?.[0],
    opponentState: opponent?.[1],
  });

  if (!opponent?.[1]?.isConnected) {
    console.log("[match-realtime] opponent not connected, notifying user", {
      userId,
      matchId,
      opponentUserId: opponent?.[0],
    });
    sendToUser(userId, { type: "opponent_left_match" });
  }

  const hasActiveInMap = activeMatchesByUser.get(userId);
  console.log("[match-realtime] current user active map state", {
    userId,
    matchId,
    hasActiveInMap,
  });

  if (!hasActiveInMap || !hasActiveInMap.isConnected) {
    activeMatchesByUser.set(activeUserMatch.userId, {
      matchId: activeUserMatch.matchId,
      isConnected: true,
    });
    console.log("[match-realtime] marked user connected to match", {
      userId,
      matchId,
      activeMatchesSize: activeMatchesByUser.size,
    });
  }

  console.log("[match-realtime] notifying opponent user joined", {
    userId,
    matchId,
    opponentUserId: opponent?.[0],
  });
  sendToUser(opponent?.[0] ?? "", { type: "opponent_joined_match" });

  console.log("[match-realtime] connect_to_match finished", {
    userId,
    matchId,
    activeMatches: [...activeMatchesByUser.entries()],
  });
};

export const broadcastCodeSubmission = async (
  ws: ArenaWebSocket,
  matchId: string,
) => {
  const { activeMatchesByUser } = getArenaWsState();

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

  const opponent = [...activeMatchesByUser.entries()].find(
    ([otherUserId, otherMatchId]) =>
      otherUserId !== userId && otherMatchId.matchId === matchId,
  );

  const hasActiveInMap = activeMatchesByUser.get(userId);
  if (!hasActiveInMap) {
    console.error("No active match for user.");
    return;
  }

  sendToUser(opponent?.[0] ?? "", { type: "opponent_submitted_code" });
  if (existingMatch.users.length && existingMatch.submissions.length) {
    const [updatedMatch] = await db
      .update(MatchTable)
      .set({ status: "finished" })
      .where(eq(MatchTable.id, existingMatch.id))
      .returning();

    if (!updatedMatch) return;
    existingMatch.users.forEach((user) => {
      sendToUser(user.userId, { type: "match_finished" });
    });
  }
};
