import { db } from "@/db/db";
import {
  OracleSessionProblemTable,
  OracleSessionTable,
  ProblemTable,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { generateText, Output } from "ai";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { mistral } from "./models/mistral";
import {
  GENERATE_ORACLE_PROBLEM_FEEDBACK_SYSTEM,
  GENERATE_ORACLE_PROBLEMS_SYSTEM,
  generateOracleProblemFeedbackPrompt,
  generateOracleProblemsPrompt,
} from "./prompts";
import { oracleProblemFeedbackSchema, oracleProblemSchema } from "./schemas";

export const generateOracleSessionProblems = async (sessionId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingOracleSession] = await db
    .select()
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.id, sessionId),
        eq(OracleSessionTable.userId, userId),
      ),
    );

  if (!existingOracleSession) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const { output } = await generateText({
      model: mistral("mistral-large-latest"),
      system: GENERATE_ORACLE_PROBLEMS_SYSTEM,
      output: Output.array({
        element: oracleProblemSchema,
      }),
      prompt: generateOracleProblemsPrompt(existingOracleSession),
    });

    return {
      error: false,
      message: "Oracle session problems generated successfully!",
      problems: output,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const generateUserProblemSubmissionFeedback = async (
  sessionId: string,
  problemId: string,
) => {
  const { userId, user } = await getCurrentUser({ allData: true });
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
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const [existingProblem] = await db
    .select({
      ...getTableColumns(OracleSessionProblemTable),
      problem: getTableColumns(ProblemTable),
    })
    .from(OracleSessionProblemTable)
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, OracleSessionProblemTable.problemId),
    )
    .where(
      and(
        eq(OracleSessionProblemTable.id, problemId),
        eq(OracleSessionProblemTable.sessionId, existingSession.id),
        eq(OracleSessionProblemTable.status, "in-progress"),
        isNull(OracleSessionProblemTable.completedAt),
      ),
    );
  if (!existingProblem) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const { output } = await generateText({
      model: mistral("mistral-large-latest"),
      system: GENERATE_ORACLE_PROBLEM_FEEDBACK_SYSTEM,
      output: Output.object({
        schema: oracleProblemFeedbackSchema,
      }),
      prompt: generateOracleProblemFeedbackPrompt({
        session: existingSession,
        oracleProblem: existingProblem,
        user: user ?? null,
      }),
    });
    if (!output) {
      throw new Error("Failed to generate solution feedback.");
    }

    return {
      error: false,
      message: "Solution feedback generated successfully!",
      output,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
