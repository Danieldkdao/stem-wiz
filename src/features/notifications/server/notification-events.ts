import { db } from "@/db/db";
import { FriendRequestTable } from "@/db/schema";
import { NotificationPayloadEvent } from "@/db/shared";
import { sendToConnection } from "@/features/realtime/server/connection-state";
import { and, eq, exists, not } from "drizzle-orm";

export const handleAcceptFriendRequestEvent = async (
  connectionId: string,
  event: NotificationPayloadEvent<"friend_request_accepted">,
) => {
  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, event.friendRequestId),
        eq(FriendRequestTable.toUserId, event.acceptedByUserId),
        exists(FriendRequestTable.acceptedAt),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Accepted friend request not found.");
  }

  sendToConnection(connectionId, {
    type: "accepted_friend_request",
    friendRequestId: existingFriendRequest.id,
  });
};

export const handleFriendRequestReceivedEvent = async (
  connectionId: string,
  event: NotificationPayloadEvent<"friend_request_received">,
) => {
  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, event.friendRequestId),
        eq(FriendRequestTable.fromUserId, event.fromUserId),
        not(exists(FriendRequestTable.acceptedAt)),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Received friend request not found.");
  }

  sendToConnection(connectionId, {
    type: "received_friend_request",
    friendRequestId: existingFriendRequest.id,
  });
};
