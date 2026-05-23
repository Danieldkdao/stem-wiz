import { NotificationTable } from "@/db/schema";
import { NotificationListItem } from "./types";

export const getNotificationListItem = (
  notification: typeof NotificationTable.$inferSelect,
): NotificationListItem => {
  const payloadType = notification.payload.type;
  switch (payloadType) {
    case "friend_request_accepted":
      return {
        ...notification,
        title: "Friend request accepted",
        message: `${notification.payload.acceptedByUserName} accepted your friend request.`,
      };
    case "friend_request_sent":
      return {
        ...notification,
        title: "Friend request received",
        message: `${notification.payload.fromUserName} sent you a friend request.`,
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
