import { db } from "@/db/db";
import { OracleProblemTable } from "@/db/schema";
import { and, eq, ExtractTablesWithRelations } from "drizzle-orm";
import { revalidateOracleSessionCache } from "./cache/oracle-sessions";
import { PgTransaction } from "drizzle-orm/pg-core";
import { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";

export const updateOracleProblem = async (
  userId: string,
  sessionId: string,
  problemId: string,
  data: Partial<typeof OracleProblemTable.$inferSelect>,
  tx?: PgTransaction<
    NeonQueryResultHKT,
    typeof import("/Users/danieldao/Desktop/stem-wiz/src/db/schema"),
    ExtractTablesWithRelations<
      typeof import("/Users/danieldao/Desktop/stem-wiz/src/db/schema")
    >
  >,
) => {
  const [updatedProblem] = await (tx ?? db)
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
