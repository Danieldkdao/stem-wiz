import { db } from "@/db/db";
import { FriendRequestTable, NotificationTable } from "@/db/schema";

export const insertFriendRequest = async (
  userName: string,
  friendRequest: typeof FriendRequestTable.$inferInsert,
) => {
  const insertedNotification = await db.transaction(async (tx) => {
    const [insertedFriendRequest] = await tx
      .insert(FriendRequestTable)
      .values(friendRequest)
      .returning();

    if (!insertFriendRequest) {
      throw new Error("Failed to insert friend request.");
    }

    const [insertedNotification] = await tx
      .insert(NotificationTable)
      .values({
        payload: {
          type: "friend_request_sent",
          friendRequestId: insertedFriendRequest.id,
          fromUserId: insertedFriendRequest.fromUserId,
          fromUserName: userName,
        },
        userId: friendRequest.toUserId,
      })
      .returning();

    if (!insertedNotification) {
      throw new Error("Failed to create new notification.");
    }

    return insertedNotification;
  });

  return insertedNotification;
};
