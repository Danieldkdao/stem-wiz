import { broadcastToFriendChat } from "./realtime-friend-chats";

const globalForRealtimeFriendChatWs = globalThis as typeof globalThis & {
  __friendChatWsState?: {
    activeUsersByChat: Map<string, Map<string, string>>;
    chatIdsByConnection: Map<string, Set<string>>;
  };
};

export const getRealtimeFriendChatWsState = () => {
  if (!globalForRealtimeFriendChatWs.__friendChatWsState) {
    globalForRealtimeFriendChatWs.__friendChatWsState = {
      activeUsersByChat: new Map(),
      chatIdsByConnection: new Map(),
    };
  }

  return globalForRealtimeFriendChatWs.__friendChatWsState;
};

export const cleanupFriendChatConnection = (connectionId: string) => {
  const { activeUsersByChat, chatIdsByConnection } =
    getRealtimeFriendChatWsState();

  const chatIds = chatIdsByConnection.get(connectionId);
  if (!chatIds) return;

  for (const chatId of chatIds) {
    const chatConnections = activeUsersByChat.get(chatId);
    const userId = chatConnections?.get(connectionId);

    chatConnections?.delete(connectionId);

    if (chatConnections?.size === 0) {
      activeUsersByChat.delete(chatId);
    }

    if (userId) {
      const stillConnected = [...(chatConnections?.values() ?? [])].includes(
        userId,
      );
      if (!stillConnected) {
        broadcastToFriendChat(chatId, {
          type: "friend_disconnected",
          userId,
          chatId,
        });
      }
    }
  }

  chatIdsByConnection.delete(connectionId);
};
