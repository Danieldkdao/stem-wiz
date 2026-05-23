import { db } from "@/db/db";
import { FriendRequestTable } from "@/db/schema";
import { NotificationPayloadEvent } from "@/db/shared";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export const handleAcceptFriendRequestEvent = async (
  event: NotificationPayloadEvent<"friend_request_accepted">,
) => {
  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, event.friendRequestId),
        eq(FriendRequestTable.toUserId, event.acceptedByUserId),
        isNotNull(FriendRequestTable.acceptedAt),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Accepted friend request not found.");
  }

  return existingFriendRequest.fromUserId;
};

export const handleFriendRequestSentEvent = async (
  event: NotificationPayloadEvent<"friend_request_sent">,
) => {
  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, event.friendRequestId),
        eq(FriendRequestTable.fromUserId, event.fromUserId),
        isNull(FriendRequestTable.acceptedAt),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Received friend request not found.");
  }

  return existingFriendRequest.toUserId;
};
