import { db } from "@/db/db";
import { UserProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateUserProfileCache } from "./cache/user-profiles";
import { revalidateUserCache } from "./cache/users";

export const upsertUserProfile = async (
  userSettings: typeof UserProfileTable.$inferInsert,
) => {
  const [upsertedUserSettings] = await db
    .insert(UserProfileTable)
    .values(userSettings)
    .onConflictDoUpdate({
      target: UserProfileTable.userId,
      set: userSettings,
    })
    .returning();

  revalidateUserProfileCache(upsertedUserSettings.userId);
  revalidateUserCache(upsertedUserSettings.userId);

  return upsertedUserSettings;
};

export const hasUserSettings = async (userId: string) => {
  const [userSettings] = await db
    .select()
    .from(UserProfileTable)
    .where(eq(UserProfileTable.userId, userId));

  return userSettings ?? null;
};
