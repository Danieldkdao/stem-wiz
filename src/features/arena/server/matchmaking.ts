import { db } from "@/db/db";
import { getArenaWsState } from "./connection-state";
import {
  ArenaProblemConfigTable,
  MatchTable,
  ProblemTable,
  ProgrammingLanguageType,
  UserMatchTable,
  UserProfileTable,
} from "@/db/schema";
import { and, eq, getTableColumns, gt, isNull, or } from "drizzle-orm";
import {
  sendToUser,
  sendToClient,
  sendToConnection,
} from "@/features/realtime/server/connection-state";
import { RealtimeWebSocket } from "@/features/realtime/lib/types";

export const joinWaitingRoom = async (ws: RealtimeWebSocket) => {
  const { usersInWaitingRoom, activeMatchesByUser } = getArenaWsState();
  const userId = ws.user.id;

  const [userSettings] = await db
    .select()
    .from(UserProfileTable)
    .where(eq(UserProfileTable.userId, userId));
  if (!userSettings) {
    sendToClient(ws, {
      type: "no_user_settings",
    });
    return;
  }

  const activeUser = activeMatchesByUser.get(userId);
  if (activeUser) {
    const activeMatch = await db.query.MatchTable.findFirst({
      where: and(
        eq(MatchTable.id, activeUser.matchId),
        eq(MatchTable.status, "in-progress"),
        or(isNull(MatchTable.expiresAt), gt(MatchTable.expiresAt, new Date())),
      ),
    });

    if (!activeMatch) {
      activeMatchesByUser.delete(userId);
    } else {
      sendToClient(ws, {
        type: "active_match_exists",
        matchId: activeMatch.id,
      });
      return;
    }
  }

  if (usersInWaitingRoom.has(userId)) return;

  usersInWaitingRoom.set(userId, {
    ...ws.user,
    userSettings,
    connectionId: ws.id,
  });

  await tryPairUsers(userId, userSettings.preferredLanguage);
};

const tryPairUsers = async (
  currentUserId: string,
  preferredLanguage: ProgrammingLanguageType,
) => {
  const { usersInWaitingRoom, activeMatchesByUser, usersInObservingRoom } =
    getArenaWsState();

  if (usersInWaitingRoom.size < 2) {
    setTimeout(() => {
      const waitingUser = usersInWaitingRoom.get(currentUserId);
      if (!waitingUser) return;
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
    sendToConnection(waitingUser.connectionId, {
      type: "no_matches_found",
    });

    return;
  }
  const currentUser = usersInWaitingRoom.get(currentUserId);
  if (!currentUser) {
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
    devSockets.forEach((devSocket) => {
      usersInWaitingRoom.delete(devSocket.dev.id);
    });

    const [arenaProblem] = await db
      .select({
        ...getTableColumns(ArenaProblemConfigTable),
        problem: getTableColumns(ProblemTable),
      })
      .from(ArenaProblemConfigTable)
      .innerJoin(
        ProblemTable,
        eq(ArenaProblemConfigTable.problemId, ProblemTable.id),
      )
      .where(eq(ProblemTable.programmingLanguage, preferredLanguage))
      .limit(1);
    if (!arenaProblem) {
      devSockets.forEach((devSocket) => {
        sendToConnection(devSocket.connectionId, {
          type: "no_problems_found",
        });
      });
      return;
    }

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

    devSockets.forEach((devSocket) => {
      activeMatchesByUser.set(devSocket.dev.id, {
        matchId,
        isConnected: false,
        connectionId: null,
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
    });
    const matchToSend = {
      ...match,
      arenaProblem,
      users: await db.query.UserMatchTable.findMany({
        where: eq(UserMatchTable.matchId, match.id),
        with: {
          user: true,
        },
      }),
    };

    usersInObservingRoom.forEach(async (userId) => {
      sendToUser(userId, {
        type: "observable_match_count_updated",
        payload: {
          type: "added",
          match: matchToSend,
        },
      });
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

export const leaveWaitingRoom = (ws: RealtimeWebSocket) => {
  const { usersInWaitingRoom } = getArenaWsState();
  const userId = ws.user.id;

  if (usersInWaitingRoom.get(userId)?.connectionId === ws.id) {
    usersInWaitingRoom.delete(userId);
  }
};
