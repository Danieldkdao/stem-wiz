import { db } from "@/db/db";
import { FriendRequestTable } from "@/db/schema";
import { NotificationPayloadEvent } from "@/db/shared";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export const handleRespondFriendRequestEvent = async (
  event: NotificationPayloadEvent<
    "friend_request_accepted" | "friend_request_rejected"
  >,
) => {
  const isAcceptedEvent = event.type === "friend_request_accepted";

  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, event.friendRequestId),
        eq(
          FriendRequestTable.toUserId,
          isAcceptedEvent ? event.acceptedByUserId : event.rejectedByUserId,
        ),
        eq(
          FriendRequestTable.status,
          isAcceptedEvent ? "accepted" : "rejected",
        ),
        isNotNull(FriendRequestTable.respondedAt),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Friend request not found.");
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
        eq(FriendRequestTable.status, "pending"),
        isNull(FriendRequestTable.respondedAt),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Received friend request not found.");
  }

  return existingFriendRequest.toUserId;
};
