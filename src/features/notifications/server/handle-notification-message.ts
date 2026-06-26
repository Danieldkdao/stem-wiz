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
    default: {
      const unexpectedMessage = message as { type?: unknown };
      messageType satisfies never;
      console.error(
        "[notifications:server] received an unexpected websocket message",
        {
          userId: ws.user.id,
          connectionId: ws.id,
          messageType: unexpectedMessage.type,
          message: unexpectedMessage,
        },
      );
      break;
    }
  }
};
