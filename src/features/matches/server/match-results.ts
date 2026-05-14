import { db } from "@/db/db";
import {
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const upsertMatchResult = async (
  data: typeof MatchResultTable.$inferInsert,
) => {
  try {
    const upsertedResult = await db.transaction(async (tx) => {
      const [upsertedResult] = await tx
        .insert(MatchResultTable)
        .values(data)
        .onConflictDoUpdate({
          target: MatchResultTable.matchId,
          set: data,
        })
        .returning();

      if (!upsertedResult) throw new Error("Failed to upsert match result.");

      await tx
        .update(MatchTable)
        .set({
          status: "finished",
        })
        .where(eq(MatchTable.id, upsertedResult.matchId));

      return upsertedResult;
    });

    return upsertedResult;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const upsertMatchSubmission = async (
  submission: typeof MatchSubmissionTable.$inferInsert,
) => {
  const [upsertedResult] = await db
    .insert(MatchSubmissionTable)
    .values(submission)
    .onConflictDoUpdate({
      target: [MatchSubmissionTable.userId, MatchSubmissionTable.matchId],
      set: submission,
    })
    .returning();

  return upsertedResult;
};
