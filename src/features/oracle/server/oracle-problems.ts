import { db, DbTransaction } from "@/db/db";
import { OracleSessionProblemTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidateOracleSessionCache } from "./cache/oracle-sessions";

export const updateOracleProblem = async (
  userId: string,
  sessionId: string,
  problemId: string,
  data: Partial<
    Omit<
      typeof OracleSessionProblemTable.$inferSelect,
      "id" | "problemId" | "sessionId"
    >
  >,
  tx?: DbTransaction,
) => {
  const [updatedProblem] = await (tx ?? db)
    .update(OracleSessionProblemTable)
    .set(data)
    .where(
      and(
        eq(OracleSessionProblemTable.sessionId, sessionId),
        eq(OracleSessionProblemTable.id, problemId),
      ),
    )
    .returning();

  revalidateOracleSessionCache(userId, sessionId);

  return updatedProblem;
};
