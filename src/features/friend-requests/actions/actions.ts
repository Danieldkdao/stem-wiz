"use server";

import { db } from "@/db/db";
import {
  FriendRequestStatusType,
  FriendRequestTable,
  NotificationEventTypeType,
  NotificationTable,
  user,
} from "@/db/schema";
import {
  insertNotificationDb,
  updateNotificationDb,
} from "@/features/notifications/server/notifications-db";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import {
  insertFriendRequestDb,
  updateFriendRequestDb,
} from "../server/friend-requests";

export const createFriendRequestAction = async (friendUserId: string) => {
  const { userId, user: currentUser } = await getCurrentUser({ allData: true });
  if (!userId || !currentUser) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }
  if (userId === friendUserId) {
    return {
      error: true,
      message: "You cannot send a friend request to yourself.",
    };
  }

  const [existingUserToFriend] = await db
    .select()
    .from(user)
    .where(eq(user.id, friendUserId));

  if (!existingUserToFriend) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.fromUserId, userId),
        eq(FriendRequestTable.toUserId, friendUserId),
        eq(FriendRequestTable.status, "pending"),
      ),
    );

  if (existingFriendRequest) {
    return {
      error: true,
      message: "You have already sent a friend request to this user.",
    };
  }

  try {
    const notification = await insertFriendRequestDb(
      currentUser.id,
      currentUser.name,
      {
        fromUserId: userId,
        toUserId: friendUserId,
      },
    );

    return {
      error: false,
      message: "Friend request sent successfully!",
      notificationId: notification.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const respondFriendRequestAction = async (
  friendRequestId: string,
  action: Exclude<FriendRequestStatusType, "pending">,
) => {
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingFriendRequest] = await db
    .select({
      ...getTableColumns(FriendRequestTable),
      fromUser: getTableColumns(user),
    })
    .from(FriendRequestTable)
    .innerJoin(user, eq(user.id, FriendRequestTable.fromUserId))
    .where(
      and(
        eq(FriendRequestTable.id, friendRequestId),
        eq(FriendRequestTable.toUserId, userId),
      ),
    );
  if (!existingFriendRequest) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const notificationPayloadType = sql<NotificationEventTypeType>`(${NotificationTable.payload}->>'type')`;
  const notificationPayloadFriendRequestId = sql<string>`(${NotificationTable.payload}->>'friendRequestId'::text)`;

  const [existingNotification] = await db
    .select()
    .from(NotificationTable)
    .where(
      and(
        eq(NotificationTable.userId, userId),
        eq(notificationPayloadType, "friend_request_sent"),
        eq(notificationPayloadFriendRequestId, existingFriendRequest.id),
      ),
    );
  if (!existingNotification) {
    // todo: handle this state better, right now the user should receive an error for this because otherwise the friend reqeust will hang just because a notification was not sent
    return {
      error: true,
      message: "No notification was found.",
    };
  }

  try {
    const [updatedNotification, insertedNotification] = await db.transaction(
      async (tx) => {
        const updatedFriendRequest = await updateFriendRequestDb(
          friendRequestId,
          {
            status: action,
            respondedAt: new Date(),
          },
          tx,
        );
        if (!updatedFriendRequest)
          throw new Error(`Failed to respond to friend request.`);

        const isAcceptedAction = action === "accepted";

        const [updatedNotification, insertedNotification] = await Promise.all([
          updateNotificationDb(
            existingNotification.id,
            userId,
            {
              readAt: null,
              // @ts-expect-error There are only two options so the ternary check guarantees the right key values
              payload: {
                type: `friend_request_${action}` as const,
                [isAcceptedAction ? "acceptedByUserId" : "rejectedByUserId"]:
                  userId,
                [isAcceptedAction
                  ? "acceptedByUserName"
                  : "rejectedByUserName"]: userInfo.name,
                friendRequestId: updatedFriendRequest.id,
                title: `Friend request ${action}`,
                message: isAcceptedAction
                  ? `You accepted the friend request. You and ${existingFriendRequest.fromUser.name} are now friends!`
                  : `You rejected ${existingFriendRequest.fromUser.name}'s friend request.`,
              },
            },
            tx,
          ),
          insertNotificationDb(
            {
              userId: updatedFriendRequest.fromUserId,
              // @ts-expect-error For the same reasons stated above
              payload: {
                type: `friend_request_${action}` as const,
                [isAcceptedAction ? "acceptedByUserId" : "rejectedByUserId"]:
                  userId,
                [isAcceptedAction
                  ? "acceptedByUserName"
                  : "rejectedByUserName"]: userInfo.name,
                friendRequestId: updatedFriendRequest.id,
                title: `Friend request ${action}`,
                message: isAcceptedAction
                  ? `${userInfo.name} has accepted your friend request. You and ${userInfo.name} are now friends!`
                  : `${userInfo.name} has rejected your friend request.`,
              },
            },
            tx,
          ),
        ]);
        if (!updatedNotification || !insertedNotification) {
          throw new Error("Failed to update/insert notifications.");
        }

        return [updatedNotification, insertedNotification];
      },
    );

    return {
      error: false,
      message: `Friend request ${action} sucessfully.`,
      notificationIds: {
        updated: updatedNotification.id,
        inserted: insertedNotification.id,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
