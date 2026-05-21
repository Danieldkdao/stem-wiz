import { db } from "@/db/db";
import { ArenaWebSocket } from "../lib/types";
import { getArenaWsState } from "./connection-state";
import {
  ArenaProblemTable,
  MatchTable,
  ProgrammingLanguageType,
  UserMatchTable,
  UserProfileTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  sendToUser,
  sendToClient,
  sendToConnection,
} from "@/features/realtime/server/connection-state";

export const joinWaitingRoom = async (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, activeMatchesByUser } = getArenaWsState();
  const userId = ws.user.id;

  console.log("[arena:waiting_room] join requested", {
    userId,
    connectionId: ws.id,
    waitingRoomSize: usersInWaitingRoom.size,
    hasActiveMatch: activeMatchesByUser.has(userId),
    alreadyWaiting: usersInWaitingRoom.has(userId),
  });

  const [userSettings] = await db
    .select()
    .from(UserProfileTable)
    .where(eq(UserProfileTable.userId, userId));
  if (!userSettings) {
    console.log("[arena:waiting_room] join rejected: missing user settings", {
      userId,
      connectionId: ws.id,
    });
    sendToClient(
      {
        type: "no_user_settings",
      },
      ws,
    );
    return;
  }

  if (activeMatchesByUser.has(userId) || usersInWaitingRoom.has(userId)) {
    console.log("[arena:waiting_room] join ignored: user already tracked", {
      userId,
      connectionId: ws.id,
      hasActiveMatch: activeMatchesByUser.has(userId),
      alreadyWaiting: usersInWaitingRoom.has(userId),
    });
    return;
  }

  usersInWaitingRoom.set(userId, {
    ...ws.user,
    userSettings,
    connectionId: ws.id,
  });

  console.log("[arena:waiting_room] user added", {
    userId,
    connectionId: ws.id,
    preferredLanguage: userSettings.preferredLanguage,
    waitingRoomSize: usersInWaitingRoom.size,
  });

  await tryPairUsers(userId, userSettings.preferredLanguage);
};

const tryPairUsers = async (
  currentUserId: string,
  preferredLanguage: ProgrammingLanguageType,
) => {
  const { usersInWaitingRoom, activeMatchesByUser, usersInObservingRoom } =
    getArenaWsState();

  console.log("[arena:matchmaking] pairing attempt started", {
    currentUserId,
    preferredLanguage,
    waitingRoomSize: usersInWaitingRoom.size,
    waitingUserIds: [...usersInWaitingRoom.keys()],
  });

  if (usersInWaitingRoom.size < 2) {
    console.log("[arena:matchmaking] waiting for more users", {
      currentUserId,
      preferredLanguage,
      waitingRoomSize: usersInWaitingRoom.size,
    });

    setTimeout(() => {
      const waitingUser = usersInWaitingRoom.get(currentUserId);
      if (!waitingUser) return;
      console.log("[arena:matchmaking] no match found after wait", {
        currentUserId,
        connectionId: waitingUser.connectionId,
        preferredLanguage,
      });
      sendToConnection(waitingUser.connectionId, {
        type: "no_matches_found",
      });
    }, 4000);
    return;
  }
  if (
    !usersInWaitingRoom
      .values()
      .find(
        (user) =>
          user.userSettings.preferredLanguage === preferredLanguage &&
          user.id !== currentUserId,
      )
  ) {
    const waitingUser = usersInWaitingRoom.get(currentUserId);
    if (!waitingUser) return;
    console.log("[arena:matchmaking] no compatible opponent found", {
      currentUserId,
      connectionId: waitingUser.connectionId,
      preferredLanguage,
      waitingRoomSize: usersInWaitingRoom.size,
    });
    sendToConnection(waitingUser.connectionId, {
      type: "no_matches_found",
    });

    return;
  }
  const currentUser = usersInWaitingRoom.get(currentUserId);
  if (!currentUser) {
    console.log("[arena:matchmaking] current user disappeared before pairing", {
      currentUserId,
      preferredLanguage,
    });
    return;
  }

  const opponent = usersInWaitingRoom
    .values()
    .find(
      (user) =>
        user.id !== currentUser?.id &&
        user.userSettings.preferredLanguage ===
          currentUser?.userSettings.preferredLanguage,
    );

  if (!opponent) {
    console.log("[arena:matchmaking] opponent disappeared before pairing", {
      currentUserId,
      connectionId: currentUser.connectionId,
      preferredLanguage,
    });
    sendToConnection(currentUser.connectionId, {
      type: "no_matches_found",
    });
    return;
  }

  const devSockets = [
    { dev: currentUser, connectionId: currentUser.connectionId, opponent },
    {
      dev: opponent,
      connectionId: opponent.connectionId,
      opponent: currentUser,
    },
  ];
  try {
    console.log("[arena:matchmaking] compatible users found", {
      matchUserIds: devSockets.map((devSocket) => devSocket.dev.id),
      connectionIds: devSockets.map((devSocket) => devSocket.connectionId),
      preferredLanguage,
    });

    devSockets.forEach((devSocket) => {
      usersInWaitingRoom.delete(devSocket.dev.id);
    });

    console.log("[arena:matchmaking] users removed from waiting room", {
      matchUserIds: devSockets.map((devSocket) => devSocket.dev.id),
      waitingRoomSize: usersInWaitingRoom.size,
    });

    const [arenaProblem] = await db
      .select()
      .from(ArenaProblemTable)
      .where(eq(ArenaProblemTable.programmingLanguage, preferredLanguage))
      .limit(1);
    if (!arenaProblem) {
      console.log("[arena:matchmaking] no arena problem found", {
        preferredLanguage,
        matchUserIds: devSockets.map((devSocket) => devSocket.dev.id),
      });
      devSockets.forEach((devSocket) => {
        sendToConnection(devSocket.connectionId, {
          type: "no_problems_found",
        });
      });
      return;
    }

    console.log("[arena:matchmaking] arena problem selected", {
      problemId: arenaProblem.id,
      preferredLanguage,
      matchUserIds: devSockets.map((devSocket) => devSocket.dev.id),
    });

    const match = await db.transaction(async (tx) => {
      const [match] = await tx
        .insert(MatchTable)
        .values({
          status: "in-progress",
          problemId: arenaProblem.id,
          expiresAt: new Date(Date.now() + arenaProblem.timeLimit),
        })
        .returning();

      if (!match) {
        throw new Error("Failed to create match.");
      }

      const createdMatchUsers = await tx
        .insert(UserMatchTable)
        .values(
          devSockets.map((devSocket) => ({
            userId: devSocket.dev.id,
            matchId: match.id,
          })),
        )
        .returning();

      if (createdMatchUsers.length !== 2) {
        throw new Error("Failed to add users to match.");
      }

      return match;
    });

    const matchId = match.id;
    console.log("[arena:matchmaking] match created", {
      matchId,
      problemId: arenaProblem.id,
      userIds: devSockets.map((devSocket) => devSocket.dev.id),
      expiresAt: match.expiresAt,
    });

    devSockets.forEach((devSocket) => {
      activeMatchesByUser.set(devSocket.dev.id, {
        matchId,
        isConnected: false,
        connectionId: null,
      });
      console.log("[arena:matchmaking] active match state initialized", {
        userId: devSocket.dev.id,
        connectionId: devSocket.connectionId,
        matchId,
        isConnected: false,
      });

      sendToConnection(devSocket.connectionId, {
        type: "match_found",
        matchId,
        opponent: {
          id: devSocket.opponent.id,
          name: devSocket.opponent.name,
          image: devSocket.opponent.image,
        },
      });
      console.log("[arena:matchmaking] match_found sent", {
        userId: devSocket.dev.id,
        connectionId: devSocket.connectionId,
        matchId,
        opponentUserId: devSocket.opponent.id,
      });
    });
    usersInObservingRoom.forEach((userId) => {
      sendToUser(userId, { type: "observable_match_count_updated" });
    });
  } catch (error) {
    console.error("[arena:matchmaking] failed to pair users", {
      currentUserId,
      preferredLanguage,
      error,
    });
    devSockets.forEach((devSocket) => {
      sendToConnection(devSocket.connectionId, {
        type: "error",
        message: "Failed to find match and pair users.",
      });
    });
  }
};

export const leaveWaitingRoom = (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom } = getArenaWsState();
  const userId = ws.user.id;

  console.log("[arena:waiting_room] leave requested", {
    userId,
    connectionId: ws.id,
    trackedConnectionId: usersInWaitingRoom.get(userId)?.connectionId,
  });

  if (usersInWaitingRoom.get(userId)?.connectionId === ws.id) {
    usersInWaitingRoom.delete(userId);
    console.log("[arena:waiting_room] user removed", {
      userId,
      connectionId: ws.id,
      waitingRoomSize: usersInWaitingRoom.size,
    });
  }
};
