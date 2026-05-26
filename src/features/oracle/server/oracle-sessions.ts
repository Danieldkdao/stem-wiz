import { db } from "@/db/db";
import { OracleSessionTable } from "@/db/schema";
import { revalidateOracleSessionCache } from "./cache/oracle-sessions";
import { and, eq, ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";

export const insertOracleSession = async (
  session: typeof OracleSessionTable.$inferInsert,
) => {
  const [insertedSession] = await db
    .insert(OracleSessionTable)
    .values(session)
    .returning();

  revalidateOracleSessionCache(insertedSession.userId, insertedSession.id);

  return insertedSession;
};

export const updateOracleSession = async (
  userId: string,
  sessionId: string,
  data: Partial<typeof OracleSessionTable.$inferSelect>,
  tx?: PgTransaction<
    NeonQueryResultHKT,
    typeof import("/Users/danieldao/Desktop/stem-wiz/src/db/schema"),
    ExtractTablesWithRelations<
      typeof import("/Users/danieldao/Desktop/stem-wiz/src/db/schema")
    >
  >,
) => {
  const [updatedSession] = await (tx ?? db)
    .update(OracleSessionTable)
    .set(data)
    .where(
      and(
        eq(OracleSessionTable.userId, userId),
        eq(OracleSessionTable.id, sessionId),
      ),
    )
    .returning();

  revalidateOracleSessionCache(updatedSession.userId, updatedSession.id);

  return updatedSession;
};
