import { generateText, Output } from "ai";
import { problemSchema } from "./schemas";
import { db } from "@/db/db";
import {
  ProblemTable,
  ProgrammingLanguageType,
  UserProfileTable,
} from "@/db/schema";
import { findActiveFriendshipById } from "@/features/friends/server/friendships";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { getCurrentUser } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";
import { generateAiProblemSystemPrompt } from "./prompts";
import { mistral } from "./models/mistral";

export const aiGenerateProblem = async (
  programmingLanguage: ProgrammingLanguageType,
  friendshipId: string,
  prompt?: string | null,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingFriendship = await findActiveFriendshipById(
    friendshipId,
    userId,
  );
  if (!existingFriendship) return null;

  try {
    const [[userOneProfile], [userTwoProfile]] = await Promise.all([
      db
        .select()
        .from(UserProfileTable)
        .where(eq(UserProfileTable.userId, userId)),
      db
        .select()
        .from(UserProfileTable)
        .where(eq(UserProfileTable.userId, existingFriendship.friend.id)),
    ]);

    const languageLabel = formatProgrammingLanguage(programmingLanguage);
    const { output } = await generateText({
      model: mistral("mistral-large-latest"),
      system: generateAiProblemSystemPrompt({
        programmingLanguage: `${languageLabel} (${programmingLanguage})`,
        userOneProfile,
        userTwoProfile,
        prompt,
      }),
      output: Output.object({
        schema: problemSchema,
      }),
      prompt:
        "Generate one suitable coding problem for this friend match. Return only the structured problem object.",
    });

    if (!output) return null;

    const [insertedProblem] = await db
      .insert(ProblemTable)
      .values({
        ...output,
        programmingLanguage,
        source: "ai",
      })
      .returning();
    if (!insertedProblem) return null;

    return insertedProblem;
  } catch (error) {
    console.error(error);
    return null;
  }
};
