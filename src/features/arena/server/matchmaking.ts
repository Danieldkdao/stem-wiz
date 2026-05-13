import { db } from "@/db/db";
import { ArenaWebSocket } from "../lib/types";
import { getArenaWsState, sendToClient } from "./connection-state";
import {
  ArenaProblemTable,
  MatchTable,
  ProgrammingLanguageType,
  UserMatchTable,
  UserSettingsTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const joinWaitingRoom = async (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, activeMatchesByUser, socketsByUser } =
    getArenaWsState();
  const userId = ws.user.id;

  const [userSettings] = await db
    .select()
    .from(UserSettingsTable)
    .where(eq(UserSettingsTable.userId, userId));
  if (!userSettings) {
    sendToClient(
      {
        type: "no_user_settings",
      },
      ws,
    );
    return;
  }

  if (activeMatchesByUser.has(userId) || usersInWaitingRoom.has(userId)) return;
  usersInWaitingRoom.set(userId, { ...ws.user, userSettings });
  socketsByUser.set(userId, ws);

  tryPairUsers(userId, userSettings.preferredLanguage);
};

const tryPairUsers = async (
  currentUserId: string,
  preferredLanguage: ProgrammingLanguageType,
) => {
  const { usersInWaitingRoom, activeMatchesByUser, socketsByUser } =
    getArenaWsState();
  if (usersInWaitingRoom.size < 2) {
    setTimeout(() => {
      if (!usersInWaitingRoom.has(currentUserId)) return;
      sendToClient(
        {
          type: "no_matches_found",
        },
        socketsByUser.get(currentUserId),
      );
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
    sendToClient(
      {
        type: "no_matches_found",
      },
      socketsByUser.get(currentUserId),
    );
    return;
  }
  const currentUser = usersInWaitingRoom.get(currentUserId);
  const opponent = usersInWaitingRoom
    .values()
    .find(
      (user) =>
        user.id !== currentUser?.id &&
        user.userSettings.preferredLanguage ===
          currentUser?.userSettings.preferredLanguage,
    );

  if (!currentUser || !opponent) {
    sendToClient(
      {
        type: "no_matches_found",
      },
      socketsByUser.get(currentUserId),
    );
    return;
  }

  const devSockets = [
    { dev: currentUser, ws: socketsByUser.get(currentUser.id), opponent },
    {
      dev: opponent,
      ws: socketsByUser.get(opponent.id),
      opponent: currentUser,
    },
  ];
  try {
    devSockets.forEach((devSocket) => {
      usersInWaitingRoom.delete(devSocket.dev.id);
    });

    const [arenaProblem] = await db
      .select()
      .from(ArenaProblemTable)
      .where(eq(ArenaProblemTable.programmingLanguage, preferredLanguage))
      .limit(1);
    if (!arenaProblem) {
      devSockets.forEach((devSocket) => {
        sendToClient(
          {
            type: "no_problems_found",
          },
          devSocket.ws,
        );
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
      });
      sendToClient(
        {
          type: "match_found",
          matchId,
          opponent: devSocket.opponent,
        },
        devSocket.ws,
      );
    });
  } catch (error) {
    console.error(error);
    devSockets.forEach((devSocket) => {
      sendToClient(
        {
          type: "error",
          message: "Failed to find match and pair users.",
        },
        devSocket.ws,
      );
    });
  }
};

export const leaveWaitingRoom = (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, socketsByUser } = getArenaWsState();
  const userId = ws.user.id;
  usersInWaitingRoom.delete(userId);
  socketsByUser.delete(userId);
};
