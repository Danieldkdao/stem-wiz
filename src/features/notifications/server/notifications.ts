import { RealtimeWebSocket } from "@/features/realtime/lib/types";
import { NotificationClientEventType } from "../lib/schemas";
import { db } from "@/db/db";
import { NotificationTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendToConnection } from "@/features/realtime/server/connection-state";
import {
  handleAcceptFriendRequestEvent,
  handleFriendRequestReceivedEvent,
} from "./notification-events";

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
  }

  const payload = existingNotification.payload;
  const eventType = payload.type;

  try {
    switch (eventType) {
      case "friend_request_accepted":
        await handleAcceptFriendRequestEvent(connectionId, payload);
        break;
      case "friend_request_received":
        await handleFriendRequestReceivedEvent(connectionId, payload);
        break;
      case "match_finished":
        break;
      case "match_invite":
        break;
      case "system":
        break;
      default:
        throw new Error(
          `Unknown notification event type: ${eventType satisfies never}`,
        );
    }
  } catch (error) {
    console.error(error);
    sendToConnection(connectionId, {
      type: "error",
      message: "Failed to send notification.",
    });
  }
};
