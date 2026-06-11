import { db } from "@/db/db";
import { NotificationTable } from "@/db/schema";
import { RealtimeWebSocket } from "@/features/realtime/lib/types";
import {
  sendToConnection,
  sendToUser,
} from "@/features/realtime/server/connection-state";
import { eq } from "drizzle-orm";
import { NotificationClientEventType } from "../lib/schemas";
import {
  handleFriendChatEvent,
  handleFriendRequestSentEvent,
  handleRespondFriendRequestEvent,
} from "./notification-events";
import { getNotificationListItem } from "../lib/formatters";

export const handleNewNotification = async (
  ws: RealtimeWebSocket,
  event: NotificationClientEventType,
) => {
  const connectionId = ws.id;

  const [existingNotification] = await db
    .select()
    .from(NotificationTable)
    .where(eq(NotificationTable.id, event.notificationId));
  if (!existingNotification) {
    sendToConnection(connectionId, {
      type: "error",
      message: "No existing notification.",
    });
    return;
  }

  const payload = existingNotification.payload;
  const eventType = payload.type;

  let recipientUserId: string | null = null;

  try {
    switch (eventType) {
      case "friend_request_accepted":
      case "friend_request_rejected":
        recipientUserId = await handleRespondFriendRequestEvent(payload);
        break;
      case "friend_request_sent":
        recipientUserId = await handleFriendRequestSentEvent(payload);
        break;
      case "new_chat":
      case "chat_deleted":
        recipientUserId = await handleFriendChatEvent(payload);
        break;
      case "match_finished":
      case "match_invite":
      case "system":
        break;
      default:
        throw new Error(
          `Unknown notification event type: ${eventType satisfies never}`,
        );
    }

    if (recipientUserId) {
      sendToUser(recipientUserId, {
        type: "new_notification",
        notification: getNotificationListItem(existingNotification),
      });
    }
  } catch (error) {
    console.error(error);
    sendToConnection(connectionId, {
      type: "error",
      message: "Failed to send notification.",
    });
  }
};
