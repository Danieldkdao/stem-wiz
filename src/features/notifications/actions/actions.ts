"use server";

import { db } from "@/db/db";
import { NotificationTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { desc, eq } from "drizzle-orm";
import { getNotificationListItem } from "../lib/formatters";

export const getUserNotificationsAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const notifications = await db
    .select()
    .from(NotificationTable)
    .where(eq(NotificationTable.userId, userId))
    .orderBy(desc(NotificationTable.createdAt));

  const notificationListItems = notifications.map((notification) =>
    getNotificationListItem(notification),
  );

  return notificationListItems;
};
