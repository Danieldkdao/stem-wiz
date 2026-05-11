"use server";

import { db } from "@/db/db";
import { MatchTable, UserMatchTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq } from "drizzle-orm";

export const checkExistingMatch = async (id: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(eq(MatchTable.id, id), eq(MatchTable.status, "in-progress")),
    with: {
      users: {
        where: eq(UserMatchTable.userId, userId),
        limit: 1,
      },
    },
  });

  if (!existingMatch || existingMatch.users.length !== 1) return null;
  return existingMatch ?? null;
};
