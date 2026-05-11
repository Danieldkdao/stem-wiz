"use server";

import { db } from "@/db/db";
import { MatchTable, UserMatchTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { and, eq } from "drizzle-orm";
import { upsertMatchResult } from "../server/match-results";

export const checkExistingMatch = async (id: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(eq(MatchTable.id, id), eq(MatchTable.status, "in-progress")),
    with: {
      arenaProblem: true,
      users: {
        where: eq(UserMatchTable.userId, userId),
        limit: 1,
      },
    },
  });

  if (!existingMatch || existingMatch.users.length !== 1) return null;
  return existingMatch ?? null;
};

export const quitMatchAction = async (matchId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
    ),
    with: {
      users: true,
    },
  });

  if (
    !existingMatch ||
    !existingMatch.users.find((user) => user.userId === userId)
  ) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  const opponent = existingMatch.users.find((user) => user.userId !== userId);
  if (!opponent) {
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  try {
    const upsertedResult = await upsertMatchResult({
      matchId: existingMatch.id,
      result: "completed",
      winnerId: opponent.userId,
    });

    if (!upsertedResult) throw new Error("Failed to quit match.");

    return {
      error: false,
      message: "Match quit successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
