import { RealtimeWebSocket } from "../../realtime/lib/types";
import { NotificationClientMessage } from "../lib/schemas";
import { handleNewNotification } from "./notifications";

export const handleNotificationMessage = async (
  ws: RealtimeWebSocket,
  message: NotificationClientMessage,
) => {
  const messageType = message.type;

  switch (messageType) {
    case "new_notification":
      await handleNewNotification(ws, message.event);
      break;
    default:
      throw new Error(
        `Unknown notification message type: ${messageType satisfies never}`,
      );
  }
};
