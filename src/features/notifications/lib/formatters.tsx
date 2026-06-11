import { NotificationPayload, NotificationTable } from "@/db/schema";
import { NotificationListItem } from "./types";
import { RespondFriendRequestButton } from "@/features/friend-requests/components/respond-friend-request-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const getNotificationListItem = (
  notification: typeof NotificationTable.$inferSelect,
): NotificationListItem => {
  const payloadType = notification.payload.type;
  switch (payloadType) {
    case "friend_request_accepted":
      return {
        ...notification,
        title: notification.payload.title,
        message: notification.payload.message,
      };
    case "friend_request_rejected":
      return {
        ...notification,
        title: notification.payload.title,
        message: notification.payload.message,
      };
    case "friend_request_sent":
      return {
        ...notification,
        title: notification.payload.title,
        message: notification.payload.message,
      };
    case "new_chat":
      return {
        ...notification,
        title: notification.payload.title,
        message: notification.payload.message,
      };
    case "chat_deleted":
      return {
        ...notification,
        title: notification.payload.title,
        message: notification.payload.message,
      };
    case "match_finished":
    case "match_invite":
    case "system":
      // todo: placeholder
      return {
        ...notification,
        title: "Placeholder",
        message: "Placeholder",
      };
    default:
      throw new Error(
        `Unknown notification payload type: ${payloadType satisfies never}`,
      );
  }
};

export const getNotificationChildren = (payload: NotificationPayload) => {
  const payloadType = payload.type;
  switch (payloadType) {
    case "friend_request_sent":
      return (
        <div className="flex items-center gap-2 w-full">
          <RespondFriendRequestButton
            friendRequestId={payload.friendRequestId}
            action="accepted"
            className="flex-1 w-full"
          >
            Accept
          </RespondFriendRequestButton>
          <RespondFriendRequestButton
            friendRequestId={payload.friendRequestId}
            action="rejected"
            variant="destructive"
            className="w-full flex-1"
          >
            Reject
          </RespondFriendRequestButton>
        </div>
      );
    case "new_chat":
      return (
        <Button className="w-full" asChild>
          <Link href={`/community/chats/${payload.chatId}`}>View chat</Link>
        </Button>
      );
    case "chat_deleted":
    case "friend_request_accepted":
    case "friend_request_rejected":
    case "match_finished":
    case "match_invite":
    case "system":
      return null;
    default:
      throw new Error(`Unknown payload type: ${payloadType satisfies never}`);
  }
};
