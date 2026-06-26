import { RealtimeWebSocket } from "@/features/realtime/lib/types";
import { FriendChatClientMessage } from "../lib/schemas";
import {
  connectToFriendChat,
  disconnectFromFriendChat,
  handleBroadcastChatChanges,
  handleBroadcastNewFriendChat,
  handleFriendMessage,
} from "./realtime-friend-chats";

export const handleRealtimeFriendChatMessage = async (
  ws: RealtimeWebSocket,
  message: FriendChatClientMessage,
) => {
  const messageType = message.type;

  switch (messageType) {
    case "new_chat":
      await handleBroadcastNewFriendChat(ws, message.chatId);
      break;
    case "connect_to_friend_chat":
      await connectToFriendChat(ws, message.chatId);
      break;
    case "disconnect_from_friend_chat":
      disconnectFromFriendChat(ws, message.chatId);
      break;
    case "new_message":
      await handleFriendMessage(ws, message.messageId, "friend_message_sent");
      break;
    case "updated_message":
      await handleFriendMessage(
        ws,
        message.messageId,
        "friend_message_updated",
      );
      break;
    case "deleted_message":
      await handleFriendMessage(
        ws,
        message.messageId,
        "friend_message_deleted",
      );
      break;
    case "updated_chat":
      await handleBroadcastChatChanges(ws, message.chatId, "updated");
      break;
    case "deleted_chat":
      await handleBroadcastChatChanges(ws, message.chatId, "deleted");
      break;
    default: {
      const unexpectedMessage = message as { type?: unknown };
      messageType satisfies never;
      console.error(
        "[friend-chat:server] received an unexpected websocket message",
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
