import { db } from "@/db/db";
import { MatchTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateText, Output } from "ai";
import { mistral } from "./models/mistral";
import {
  GENERATE_MATCH_RESULTS_SYSTEM,
  generateMatchResultsPrompt,
} from "./prompts";

export const generateMatchResults = async (matchId: string) => {
  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
    ),
    with: {
      arenaProblem: true,
      users: true,
      submissions: true,
      result: true,
    },
  });

  if (!existingMatch || existingMatch.result) return;

  try {
    const response = await generateText({
      model: mistral("mistral-medium-latest"),
      system: GENERATE_MATCH_RESULTS_SYSTEM,
      output: Output.choice({
        options: [...existingMatch.users.map((user) => user.userId), "none"],
      }),
      prompt: generateMatchResultsPrompt({
        arenaProblem: existingMatch.arenaProblem,
        users: existingMatch.users,
        submissions: existingMatch.submissions,
      }),
    });

    // todo: improve reliablity, retries

    const output = response.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    const parsed = JSON.parse(output);
    const winnerId = parsed.result;

    return winnerId;
  } catch (error) {
    console.error(error);
    return null;
  }
};
