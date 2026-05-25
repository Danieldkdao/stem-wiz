import { db } from "@/db/db";
import { OracleSessionTable } from "@/db/schema";
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
