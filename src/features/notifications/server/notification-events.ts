import { db } from "@/db/db";
import { ChatTable, FriendRequestTable } from "@/db/schema";
import { NotificationPayloadEvent } from "@/db/shared";
import { findActiveFriendshipById } from "@/features/friends/server/friendships";
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

export const handleFriendChatEvent = async (
  event: NotificationPayloadEvent<"new_chat" | "chat_deleted">,
) => {
  const eventType = event.type;
  const userId = event.userId;

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, event.chatId));

  if (eventType === "chat_deleted") {
    if (existingChat) {
      throw new Error("Chat not deleted.");
    } else {
      return userId;
    }
  }

  if (!existingChat || !existingChat.friendshipId) {
    throw new Error("Chat not found.");
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) return null;

  return existingFriendship.friend.id;
};
