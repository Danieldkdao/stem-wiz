"use server";

import { db } from "@/db/db";
import { NotificationTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getNotificationListItem } from "../lib/formatters";
import {
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { areValidIds } from "@/lib/utils";

export const getUserNotificationsAction = async (page: number) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const offset = (page - 1) * PAGE_SIZE;

  const notifications = await db
    .select()
    .from(NotificationTable)
    .where(eq(NotificationTable.userId, userId))
    .orderBy(desc(NotificationTable.createdAt))
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalNotifications] = await db
    .select({
      count: count(),
    })
    .from(NotificationTable)
    .where(eq(NotificationTable.userId, userId));

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalNotifications.count;

  const notificationListItems = notifications.map((notification) =>
    getNotificationListItem(notification),
  );

  return {
    notificationListItems,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const markUserNotificationsReadAction = async (
  notificationId?: string,
) => {
  if (notificationId && !areValidIds([notificationId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const notifications = await db
    .update(NotificationTable)
    .set({
      readAt: new Date(),
    })
    .where(
      and(
        eq(NotificationTable.userId, userId),
        isNull(NotificationTable.readAt),
        notificationId ? eq(NotificationTable.id, notificationId) : undefined,
      ),
    )
    .returning();

  return {
    error: false,
    message: "Notifications marked as read",
    notificationIds: notifications.map((notification) => notification.id),
  };
};
