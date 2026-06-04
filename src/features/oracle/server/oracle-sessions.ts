import { db, DbTransaction } from "@/db/db";
import { OracleSessionTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidateOracleSessionCache } from "./cache/oracle-sessions";

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
  tx?: DbTransaction,
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
