import { db } from "@/db/db";
import { OracleProblemTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidateOracleSessionCache } from "./cache/oracle-sessions";

export const updateOracleProblem = async (
  userId: string,
  sessionId: string,
  problemId: string,
  data: Partial<typeof OracleProblemTable.$inferSelect>,
) => {
  const [updatedProblem] = await db
    .update(OracleProblemTable)
    .set(data)
    .where(
      and(
        eq(OracleProblemTable.sessionId, sessionId),
        eq(OracleProblemTable.id, problemId),
      ),
    )
    .returning();

  revalidateOracleSessionCache(userId, sessionId);

  return updatedProblem;
};
