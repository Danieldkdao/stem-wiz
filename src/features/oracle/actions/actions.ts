"use server";

import { db, DbTransaction } from "@/db/db";
import {
  ChatMessageTable,
  ChatTable,
  OracleSessionProblemTable,
  OracleSessionModeType,
  OracleSessionStatusType,
  OracleSessionTable,
  ProblemTable,
  ProgrammingLanguageType,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import {
  generateOracleSessionProblems,
  generateUserProblemSubmissionFeedback,
} from "@/services/ai/oracle";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import { OracleSessionsSortByOptionsType } from "../lib/params";
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
import { areValidIds } from "@/lib/utils";

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
  if (!areValidIds([sessionId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
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

export const getUserSessionsAction = async (
  userId: string,
  filterOptions: {
    search: string;
    sortBy: OracleSessionsSortByOptionsType;
    languages: ProgrammingLanguageType[];
    statuses: OracleSessionStatusType[];
    modes: OracleSessionModeType[];
    page: number;
  },
) => {
  "use cache";
  cacheTag(getOracleSessionUserTag(userId));

  const { search, sortBy, languages, statuses, modes, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const sessionDuration = sql<number>`EXTRACT(
    EXPOCH FROM COALESCE(${OracleSessionTable.completedAt}, NOW()) - ${OracleSessionTable.startedAt}
  )`;

  const sortByMap: Record<OracleSessionsSortByOptionsType, SQL<unknown>> = {
    most_recent: desc(OracleSessionTable.createdAt),
    oldest: asc(OracleSessionTable.createdAt),
    most_problems: desc(OracleSessionTable.numberOfProblems),
    recently_completed: desc(OracleSessionTable.completedAt),
    longest_duration: desc(sessionDuration),
  };

  const whereQuery = and(
    eq(OracleSessionTable.userId, userId),
    search.trim()
      ? or(
          ilike(OracleSessionTable.title, `%${search.trim()}%`),
          ilike(OracleSessionTable.description, `%${search.trim()}%`),
          ilike(
            OracleSessionTable.additionalInstructions,
            `%${search.trim()}%`,
          ),
        )
      : undefined,
    languages.length
      ? inArray(OracleSessionTable.programmingLanguage, languages)
      : undefined,
    statuses.length ? inArray(OracleSessionTable.status, statuses) : undefined,
    modes.length ? inArray(OracleSessionTable.mode, modes) : undefined,
  );

  const userSessions = await db
    .select()
    .from(OracleSessionTable)
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalUserSessions] = await db
    .select({
      count: count(),
    })
    .from(OracleSessionTable)
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalUserSessions.count;

  return {
    userSessions,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const getOneSessionAction = async (
  userId: string,
  sessionId: string,
) => {
  "use cache";
  cacheTag(getOracleSessionIdTag(sessionId));

  if (!areValidIds([sessionId])) return null;

  const existingSession = await db.query.OracleSessionTable.findFirst({
    where: and(
      eq(OracleSessionTable.userId, userId),
      eq(OracleSessionTable.id, sessionId),
    ),
    with: {
      user: true,
      problems: {
        with: {
          problem: true,
          chat: {
            with: {
              messages: {
                orderBy: [
                  desc(ChatMessageTable.createdAt),
                  desc(ChatMessageTable.id),
                ],
                limit: PAGE_SIZE + 1,
              },
            },
          },
        },
        orderBy: [
          asc(OracleSessionProblemTable.order),
          asc(OracleSessionProblemTable.id),
        ],
      },
    },
  });

  if (!existingSession) return null;

  return {
    ...existingSession,
    problems: existingSession.problems.map((problem) => ({
      ...problem,
      chat: problem.chat
        ? (() => {
            const messages = problem.chat.messages.reverse();

            return {
              ...problem.chat,
              hasNextMessagesPage: messages.length > PAGE_SIZE,
              messages: messages.slice(-PAGE_SIZE),
            };
          })()
        : problem.chat,
    })),
  };
};

export const getOracleChatMessagesAction = async (
  chatId: string,
  page: number,
) => {
  if (!areValidIds([chatId])) return null;
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const offset = (page - 1) * PAGE_SIZE;

  const chatMessages = await db
    .select({
      ...getTableColumns(ChatMessageTable),
    })
    .from(ChatMessageTable)
    .innerJoin(ChatTable, eq(ChatTable.id, ChatMessageTable.chatId))
    .innerJoin(
      OracleSessionProblemTable,
      eq(OracleSessionProblemTable.id, ChatTable.oracleProblemId),
    )
    .innerJoin(
      OracleSessionTable,
      eq(OracleSessionTable.id, OracleSessionProblemTable.sessionId),
    )
    .where(
      and(
        eq(ChatMessageTable.chatId, chatId),
        eq(OracleSessionTable.userId, userId),
      ),
    )
    .orderBy(desc(ChatMessageTable.createdAt), desc(ChatMessageTable.id))
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalChatMessages] = await db
    .select({
      count: count(),
    })
    .from(ChatMessageTable)
    .innerJoin(ChatTable, eq(ChatTable.id, ChatMessageTable.chatId))
    .innerJoin(
      OracleSessionProblemTable,
      eq(OracleSessionProblemTable.id, ChatTable.oracleProblemId),
    )
    .innerJoin(
      OracleSessionTable,
      eq(OracleSessionTable.id, OracleSessionProblemTable.sessionId),
    )
    .where(
      and(
        eq(ChatMessageTable.chatId, chatId),
        eq(OracleSessionTable.userId, userId),
      ),
    );

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalChatMessages.count;

  return {
    chatMessages: chatMessages.reverse(),
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const startSessionAction = async (sessionId: string) => {
  if (!areValidIds([sessionId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
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

      const insertedProblems = await tx
        .insert(ProblemTable)
        .values(
          response.problems.map((problem) => ({
            ...problem,
            programmingLanguage: updatedSession.programmingLanguage,
            source: "ai" as const,
          })),
        )
        .returning();
      if (insertedProblems.length !== response.problems.length)
        throw new Error("Failed to create session problems.");

      await tx.insert(OracleSessionProblemTable).values(
        insertedProblems.map((problem, index) => ({
          problemId: problem.id,
          sessionId: existingSession.id,
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
  if (!areValidIds([sessionId, problemId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
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
      message: "Failed to save your code.",
    };
  }

  const [existingProblem] = await db
    .select()
    .from(OracleSessionProblemTable)
    .where(
      and(
        eq(OracleSessionProblemTable.id, problemId),
        eq(OracleSessionProblemTable.sessionId, existingSession.id),
      ),
    );

  if (!existingProblem) {
    return {
      error: true,
      message: "Failed to save your code.",
    };
  }

  try {
    const updatedProblem = await updateOracleProblem(
      userId,
      existingSession.id,
      problemId,
      {
        userCode,
        startedAt: existingProblem.startedAt
          ? existingProblem.startedAt
          : new Date(),
      },
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
  code: string,
) => {
  if (!areValidIds([sessionId, problemId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
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
    await updateOracleProblem(userId, existingSession.id, problemId, {
      userCode: code,
    });
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

const checkSessionCompletionAction = async (
  sessionId: string,
  tx?: DbTransaction,
) => {
  if (!areValidIds([sessionId])) throw new Error(NOT_FOUND_ERROR_MESSAGE);
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
    .from(OracleSessionProblemTable)
    .where(eq(OracleSessionProblemTable.sessionId, existingOracleSession.id));
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
