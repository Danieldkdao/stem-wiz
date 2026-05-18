import { db } from "@/db/db";
import { UserProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateUserSettingsCache } from "./cache/user-settings";

export const upsertUserSettings = async (
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

  revalidateUserSettingsCache(upsertedUserSettings.userId);

  return upsertedUserSettings;
};

export const hasUserSettings = async (userId: string) => {
  const [userSettings] = await db
    .select()
    .from(UserProfileTable)
    .where(eq(UserProfileTable.userId, userId));

  return userSettings ?? null;
};
