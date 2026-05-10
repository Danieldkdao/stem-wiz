import { db } from "@/db/db";
import { UserSettingsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateUserSettingsCache } from "./cache/user-settings";

export const upsertUserSettings = async (
  userSettings: typeof UserSettingsTable.$inferInsert,
) => {
  const [upsertedUserSettings] = await db
    .insert(UserSettingsTable)
    .values(userSettings)
    .onConflictDoUpdate({
      target: UserSettingsTable.userId,
      set: userSettings,
    })
    .returning();

  revalidateUserSettingsCache(upsertedUserSettings.userId);

  return upsertedUserSettings;
};

export const hasUserSettings = async (userId: string) => {
  const [userSettings] = await db
    .select()
    .from(UserSettingsTable)
    .where(eq(UserSettingsTable.userId, userId));

  return userSettings ?? null;
};
