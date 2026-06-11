import { db } from "@/db/db";
import { ChatTable, FriendRequestTable, user } from "@/db/schema";
import { NotificationPayloadEvent } from "@/db/shared";
import { and, eq, getTableColumns, isNotNull, isNull, or } from "drizzle-orm";

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

  if (!existingChat || !existingChat.friendRequestId) {
    throw new Error("Chat not found.");
  }

  const [existingFriendRequest] = await db
    .select({
      ...getTableColumns(FriendRequestTable),
      otherUserId: user.id,
    })
    .from(FriendRequestTable)
    .innerJoin(
      user,
      or(
        and(
          eq(FriendRequestTable.fromUserId, userId),
          eq(FriendRequestTable.toUserId, user.id),
        ),
        and(
          eq(FriendRequestTable.fromUserId, user.id),
          eq(FriendRequestTable.toUserId, userId),
        ),
      ),
    )
    .where(
      and(
        eq(FriendRequestTable.id, existingChat.friendRequestId),
        eq(FriendRequestTable.status, "accepted"),
        or(
          eq(FriendRequestTable.fromUserId, userId),
          eq(FriendRequestTable.toUserId, userId),
        ),
      ),
    );
  if (!existingFriendRequest) {
    throw new Error("Friend request not found.");
  }

  return existingFriendRequest.otherUserId;
};
