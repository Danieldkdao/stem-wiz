import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";

export const getCurrentUser = async ({ allData = false } = {}) => {
  const session = await auth.api.getSession({ headers: await headers() });

  return {
    userId: session?.user.id ?? null,
    user: allData
      ? await db.query.user.findFirst({
          where: eq(user.id, session?.user.id ?? ""),
        })
      : null,
  };
};
