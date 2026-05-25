import { db } from "@/db/db";
import { OracleSessionTable } from "@/db/schema";
import { revalidateOracleSessionCache } from "./cache/oracle-sessions";
import { and, eq } from "drizzle-orm";

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
) => {
  const [updatedSession] = await db
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
