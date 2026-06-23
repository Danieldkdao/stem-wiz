import { db, DbTransaction } from "@/db/db";
import { FriendMatchRequestTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const updateMatchRequestDb = async (
  matchRequestId: string,
  matchRequestData: Pick<
    Partial<typeof FriendMatchRequestTable.$inferSelect>,
    "status" | "matchId" | "expiresAt" | "timeLimit" | "respondedAt"
  >,
  tx?: DbTransaction,
) => {
  const [updatedMatchRequest] = await (tx ?? db)
    .update(FriendMatchRequestTable)
    .set(matchRequestData)
    .where(eq(FriendMatchRequestTable.id, matchRequestId))
    .returning();

  return updatedMatchRequest;
};
