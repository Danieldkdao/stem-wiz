import { db, DbTransaction } from "@/db/db";
import { NotificationTable } from "@/db/schema";
import { revalidateUserCache } from "@/features/social/server/cache/users";
import { and, eq } from "drizzle-orm";

export const insertNotificationDb = async (
  notificationData: typeof NotificationTable.$inferInsert,
  tx?: DbTransaction,
) => {
  const [insertedNotification] = await (tx ?? db)
    .insert(NotificationTable)
    .values(notificationData)
    .returning();

  revalidateUserCache(insertedNotification.userId);

  return insertedNotification;
};

export const updateNotificationDb = async (
  notificationId: string,
  userId: string,
  notificationData: Partial<typeof NotificationTable.$inferSelect>,
  tx?: DbTransaction,
) => {
  const [updatedNotification] = await (tx ?? db)
    .update(NotificationTable)
    .set(notificationData)
    .where(
      and(
        eq(NotificationTable.userId, userId),
        eq(NotificationTable.id, notificationId),
      ),
    )
    .returning();

  revalidateUserCache(updatedNotification.userId);

  return updatedNotification;
};
