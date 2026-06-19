import { db, DbTransaction } from "@/db/db";
import { FriendRequestTable } from "@/db/schema";
import { insertNotificationDb } from "@/features/notifications/server/notifications-db";
import { revalidateUserCache } from "@/features/social/server/cache/users";
import { eq } from "drizzle-orm";

export const insertFriendRequestDb = async (
  userId: string,
  userName: string,
  friendRequest: typeof FriendRequestTable.$inferInsert,
) => {
  const insertedNotification = await db.transaction(async (tx) => {
    const [insertedFriendRequest] = await tx
      .insert(FriendRequestTable)
      .values(friendRequest)
      .returning();

    if (!insertFriendRequestDb) {
      throw new Error("Failed to insert friend request.");
    }

    const insertedNotification = await insertNotificationDb(
      {
        payload: {
          type: "friend_request_sent",
          friendRequestId: insertedFriendRequest.id,
          fromUserId: insertedFriendRequest.fromUserId,
          fromUserName: userName,
          title: "Friend request received",
          message: `${userName} has sent you a friend request.`,
        },
        userId: friendRequest.toUserId,
      },
      tx,
    );

    if (!insertedNotification) {
      throw new Error("Failed to create new notification.");
    }

    return insertedNotification;
  });

  revalidateUserCache(userId);

  return insertedNotification;
};

export const updateFriendRequestDb = async (
  friendRequestId: string,
  friendRequestData: Partial<typeof FriendRequestTable.$inferSelect>,
  tx?: DbTransaction,
) => {
  const [updatedFriendRequest] = await (tx ?? db)
    .update(FriendRequestTable)
    .set(friendRequestData)
    .where(eq(FriendRequestTable.id, friendRequestId))
    .returning();

  revalidateUserCache(updatedFriendRequest.fromUserId);
  revalidateUserCache(updatedFriendRequest.toUserId);

  return updatedFriendRequest;
};
