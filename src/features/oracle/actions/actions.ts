"use server";

import { db } from "@/db/db";
import {
  ChatMessageTable,
  OracleProblemTable,
  OracleSessionTable,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import {
  generateOracleSessionProblems,
  generateUserProblemSubmissionFeedback,
} from "@/services/ai/oracle";
import { and, asc, desc, eq, ExtractTablesWithRelations } from "drizzle-orm";
import { cacheTag } from "next/cache";
import {
  getOracleSessionIdTag,
  getOracleSessionUserTag,
} from "../server/cache/oracle-sessions";
import { updateOracleProblem } from "../server/oracle-problems";
import {
  insertOracleSession,
  updateOracleSession,
} from "../server/oracle-sessions";
import {
  oracleSessionActionSchema,
  OracleSessionActionSchemaType,
} from "./schemas";
import { PgTransaction } from "drizzle-orm/pg-core";
import { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";

export const createNewSessionAction = async (
  unsafeData: OracleSessionActionSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { success, data } = oracleSessionActionSchema.safeParse(unsafeData);
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

export const updateSessionAction = async (
  sessionId: string,
  unsafeData: OracleSessionActionSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingSession] = await db
    .select()
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.userId, userId),
        eq(OracleSessionTable.id, sessionId),
      ),
    );

  if (!existingSession) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { success, data } = oracleSessionActionSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedSession = await updateOracleSession(
      userId,
      existingSession.id,
      data,
    );
    if (!updatedSession) {
      throw new Error("Failed to update session.");
    }

    return {
      error: false,
      message: "Session details updated successfully!",
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
    with: {
      user: true,
      problems: {
        with: {
          chat: {
            with: {
              messages: {
                orderBy: [
                  asc(ChatMessageTable.createdAt),
                  asc(ChatMessageTable.id),
                ],
              },
            },
          },
        },
        orderBy: [asc(OracleProblemTable.order), asc(OracleProblemTable.id)],
      },
    },
  });

  return existingSession ?? null;
};

export const startSessionAction = async (sessionId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingSession] = await db
    .select()
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.userId, userId),
        eq(OracleSessionTable.id, sessionId),
      ),
    );
  if (!existingSession) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    await db.transaction(async (tx) => {
      const updatedSession = await updateOracleSession(
        userId,
        sessionId,
        {
          startedAt: new Date(),
          status: "active",
        },
        tx,
      );

      if (!updatedSession || updatedSession.status !== "active") {
        throw new Error("Failed to begin the session.");
      }

      const response = await generateOracleSessionProblems(existingSession.id);

      if (
        response.error ||
        !response.problems ||
        response.problems.length !== existingSession.numberOfProblems
      ) {
        throw new Error(response.message);
      }

      await tx.insert(OracleProblemTable).values(
        response.problems.map((problem, index) => ({
          ...problem,
          sessionId: existingSession.id,
          language: existingSession.programmingLanguage,
          order: index + 1,
        })),
      );
    });

    return {
      error: false,
      message: "Session configured successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const saveUserCodeAction = async (
  sessionId: string,
  problemId: string,
  userCode: string,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingSession] = await db
    .select()
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.id, sessionId),
        eq(OracleSessionTable.userId, userId),
      ),
    );
  if (!existingSession) {
    return {
      error: true,
      message: "Failed to your save code.",
    };
  }

  try {
    const updatedProblem = await updateOracleProblem(
      userId,
      existingSession.id,
      problemId,
      { userCode },
    );

    if (!updatedProblem) {
      throw new Error("Failed to save your code.");
    }

    return {
      error: false,
      message: "Code saved successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: "Failed to save your code.",
    };
  }
};

export const handleUserProblemSubmissionAction = async (
  sessionId: string,
  problemId: string,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingSession] = await db
    .select()
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.userId, userId),
        eq(OracleSessionTable.id, sessionId),
      ),
    );
  if (!existingSession) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const response = await generateUserProblemSubmissionFeedback(
      existingSession.id,
      problemId,
    );
    if (response.error || !response.output) {
      throw new Error(response.message);
    }

    await db.transaction(async (tx) => {
      const updatedProblem = await updateOracleProblem(
        userId,
        existingSession.id,
        problemId,
        {
          status: "completed",
          completedAt: new Date(),
          feedback: response.output.feedback,
          score: response.output.score,
        },
        tx,
      );
      if (!updatedProblem) {
        throw new Error("Failed to update problem.");
      }

      await checkSessionCompletionAction(existingSession.id, tx);
    });

    return response;
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const checkSessionCompletionAction = async (
  sessionId: string,
  tx?: PgTransaction<
    NeonQueryResultHKT,
    typeof import("/Users/danieldao/Desktop/stem-wiz/src/db/schema"),
    ExtractTablesWithRelations<
      typeof import("/Users/danieldao/Desktop/stem-wiz/src/db/schema")
    >
  >,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

  const dbSrc = tx ?? db;

  const [existingOracleSession] = await dbSrc
    .select()
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.userId, userId),
        eq(OracleSessionTable.id, sessionId),
      ),
    );
  if (!existingOracleSession) throw new Error(NOT_FOUND_ERROR_MESSAGE);

  const sessionProblems = await dbSrc
    .select()
    .from(OracleProblemTable)
    .where(eq(OracleProblemTable.sessionId, existingOracleSession.id));
  if (sessionProblems.length !== existingOracleSession.numberOfProblems)
    throw new Error(NOT_FOUND_ERROR_MESSAGE);

  if (
    sessionProblems.every(
      (problem) => problem.status === "completed" && problem.completedAt,
    ) &&
    (existingOracleSession.status !== "completed" ||
      !existingOracleSession.completedAt)
  ) {
    await updateOracleSession(
      userId,
      existingOracleSession.id,
      {
        status: "completed",
        completedAt: new Date(),
      },
      tx,
    );
  }
};
