"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  oracleSessionCreationSchema,
  OracleSessionCreationSchemaType,
} from "./schemas";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { insertOracleSession } from "../server/oracle-sessions";
import { cacheTag } from "next/cache";
import {
  getOracleSessionIdTag,
  getOracleSessionUserTag,
} from "../server/cache/oracle-sessions";
import { db } from "@/db/db";
import { OracleSessionTable } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const createNewSessionAction = async (
  unsafeData: OracleSessionCreationSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { success, data } = oracleSessionCreationSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const createdSession = await insertOracleSession({
      userId,
      ...data,
      title: data.title ?? "New Session",
    });

    if (!createdSession) {
      throw new Error("Failed to create session.");
    }

    return {
      error: false,
      message: "Session created successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getUserSessionsAction = async (userId: string) => {
  "use cache";
  cacheTag(getOracleSessionUserTag(userId));

  const userSessions = await db
    .select()
    .from(OracleSessionTable)
    .where(eq(OracleSessionTable.userId, userId))
    .orderBy(desc(OracleSessionTable.createdAt));

  return userSessions;
};

export const getOneSessionAction = async (
  userId: string,
  sessionId: string,
) => {
  "use cache";
  cacheTag(getOracleSessionIdTag(sessionId));

  const existingSession = await db.query.OracleSessionTable.findFirst({
    where: and(
      eq(OracleSessionTable.userId, userId),
      eq(OracleSessionTable.id, sessionId),
    ),
  });

  return existingSession ?? null;
};
