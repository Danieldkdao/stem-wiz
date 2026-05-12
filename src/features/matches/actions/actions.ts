"use server";

import { db } from "@/db/db";
import { MatchTable, UserMatchTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { and, eq, gt, lte } from "drizzle-orm";
import { upsertMatchResult } from "../server/match-results";

export const checkExistingMatch = async (id: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

  // todo: maybe add a separate check for expiration to send down a specific error and display a better match timed out error on page
  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, id),
      eq(MatchTable.status, "in-progress"),
      gt(MatchTable.expiresAt, new Date()),
    ),
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

export const handleMatchTimeoutAction = async (matchId: string) => {
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
      lte(MatchTable.expiresAt, new Date()),
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
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  try {
    const upsertedResult = await upsertMatchResult({
      matchId: existingMatch.id,
      result: "timed_out",
    });

    if (!upsertedResult) throw new Error("Failed to timeout match.");

    return {
      error: false,
      message: "Match timed out.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
