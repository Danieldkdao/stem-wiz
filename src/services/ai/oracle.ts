import { db } from "@/db/db";
import { OracleSessionTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { generateText, Output } from "ai";
import { and, eq } from "drizzle-orm";
import { mistral } from "./models/mistral";
import {
  GENERATE_ORACLE_PROBLEMS_SYSTEM,
  generateOracleProblemsPrompt,
} from "./prompts";
import { oracleProblemSchema } from "./schemas";

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
