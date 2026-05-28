import { db } from "@/db/db";
import { OracleProblemTable, OracleSessionTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { generateText, Output } from "ai";
import { and, eq, isNull } from "drizzle-orm";
import { mistral } from "./models/mistral";
import {
  GENERATE_ORACLE_PROBLEM_FEEDBACK_SYSTEM,
  GENERATE_ORACLE_PROBLEMS_SYSTEM,
  generateOracleProblemFeedbackPrompt,
  generateOracleProblemsPrompt,
} from "./prompts";
import { oracleProblemSchema } from "./schemas";
import { updateOracleProblem } from "@/features/oracle/server/oracle-problems";

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
    .select()
    .from(OracleProblemTable)
    .where(
      and(
        eq(OracleProblemTable.id, problemId),
        eq(OracleProblemTable.sessionId, existingSession.id),
        eq(OracleProblemTable.status, "in-progress"),
        isNull(OracleProblemTable.completedAt),
      ),
    );
  if (!existingProblem) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const { text } = await generateText({
      model: mistral("mistral-large-latest"),
      system: GENERATE_ORACLE_PROBLEM_FEEDBACK_SYSTEM,
      prompt: generateOracleProblemFeedbackPrompt({
        session: existingSession,
        problem: existingProblem,
        user: user ?? null,
      }),
    });
    if (!text) {
      throw new Error("Failed to generate solution feedback.");
    }

    const updatedProblem = await updateOracleProblem(
      userId,
      existingSession.id,
      existingProblem.id,
      { status: "completed", completedAt: new Date(), feedback: text },
    );

    if (!updatedProblem) {
      throw new Error("Failed to update problem.");
    }

    return {
      error: false,
      message: "Solution feedback generated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
