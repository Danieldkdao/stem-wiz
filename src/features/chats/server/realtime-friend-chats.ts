import { db } from "@/db/db";
import { ChatMessageTable, ChatTable, user } from "@/db/schema";
import { findActiveFriendshipById } from "@/features/friends/server/friendships";
import {
  RealtimeServerMessage,
  RealtimeWebSocket,
} from "@/features/realtime/lib/types";
import {
  sendToConnection,
  sendToUser,
} from "@/features/realtime/server/connection-state";
import { NO_PERMISSION_DATA_MESSAGE } from "@/lib/constants";
import { and, eq, getTableColumns } from "drizzle-orm";
import { getRealtimeFriendChatWsState } from "./connection-state";

export const broadcastToFriendChat = (
  chatId: string,
  message: RealtimeServerMessage,
  exceptConnectionId?: string,
) => {
  const { activeUsersByChat } = getRealtimeFriendChatWsState();

  activeUsersByChat.get(chatId)?.forEach((_, connectionId) => {
    if (connectionId === exceptConnectionId) return;
    sendToConnection(connectionId, message);
  });
};

export const handleBroadcastNewFriendChat = async (
  ws: RealtimeWebSocket,
  chatId: string,
) => {
  const userId = ws.user.id;
  const connectionId = ws.id;

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat || !existingChat.friendshipId) {
    sendToConnection(connectionId, {
      type: "error",
      message: "Chat not found.",
    });
    return;
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    sendToConnection(connectionId, {
      type: "error",
      message: NO_PERMISSION_DATA_MESSAGE,
    });
    return;
  }

  sendToUser(existingFriendship.friend.id, {
    type: "new_chat",
    chat: {
      ...existingChat,
      user: existingFriendship.friend,
      messageCount: 0,
    },
  });
};

export const connectToFriendChat = async (
  ws: RealtimeWebSocket,
  chatId: string,
) => {
  const connectionId = ws.id;
  const userId = ws.user.id;

  const { activeUsersByChat, chatIdsByConnection } =
    getRealtimeFriendChatWsState();

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat || !existingChat.friendshipId) {
    sendToConnection(connectionId, {
      type: "connection_error",
      message: "Chat not found.",
    });
    return;
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    sendToConnection(connectionId, {
      type: "connection_error",
      message: "You don't have permission to access this chat.",
    });
    return;
  }

  const chatConnections =
    activeUsersByChat.get(existingChat.id) ?? new Map<string, string>();
  const connectionChatIds =
    chatIdsByConnection.get(connectionId) ?? new Set<string>();

  chatConnections.forEach((connectedUserId, connectedConnectionId) => {
    if (connectedConnectionId === connectionId) return;

    sendToConnection(connectionId, {
      type: "friend_connected",
      userId: connectedUserId,
      chatId: existingChat.id,
    });
  });

  chatConnections.set(connectionId, userId);
  activeUsersByChat.set(existingChat.id, chatConnections);

  connectionChatIds.add(existingChat.id);
  chatIdsByConnection.set(connectionId, connectionChatIds);

  broadcastToFriendChat(
    existingChat.id,
    {
      type: "friend_connected",
      userId,
      chatId: existingChat.id,
    },
    connectionId,
  );
};

export const disconnectFromFriendChat = (
  ws: RealtimeWebSocket,
  chatId: string,
) => {
  const { activeUsersByChat, chatIdsByConnection } =
    getRealtimeFriendChatWsState();

  const chatConnections = activeUsersByChat.get(chatId);
  const userId = chatConnections?.get(ws.id);

  chatConnections?.delete(ws.id);

  chatIdsByConnection.get(ws.id)?.delete(chatId);

  if (chatConnections?.size === 0) {
    activeUsersByChat.delete(chatId);
  }

  if (!userId) return;

  const stillConnected = [...(chatConnections?.values() ?? [])].includes(
    userId,
  );
  if (!stillConnected) {
    broadcastToFriendChat(chatId, {
      type: "friend_disconnected",
      chatId,
      userId,
    });
  }
};

export const handleFriendMessage = async (
  ws: RealtimeWebSocket,
  messageId: string,
  type:
    | "friend_message_sent"
    | "friend_message_updated"
    | "friend_message_deleted",
) => {
  const connectionId = ws.id;
  const userId = ws.user.id;

  const [existingChatMessage] = await db
    .select({
      ...getTableColumns(ChatMessageTable),
      user: getTableColumns(user),
    })
    .from(ChatMessageTable)
    .innerJoin(user, eq(user.id, ChatMessageTable.userId))
    .where(
      and(
        eq(ChatMessageTable.id, messageId),
        eq(ChatMessageTable.userId, userId),
      ),
    );
  if (!existingChatMessage) {
    sendToConnection(connectionId, {
      type: "error",
      message: "Message not found.",
    });
    return;
  }

  broadcastToFriendChat(existingChatMessage.chatId, {
    type,
    message: existingChatMessage,
  });
};

export const handleBroadcastChatChanges = async (
  ws: RealtimeWebSocket,
  chatId: string,
  type: "updated" | "deleted",
) => {
  const connectionId = ws.id;

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat && type === "deleted") {
    broadcastToFriendChat(
      chatId,
      {
        type: "friend_chat_deleted",
        message: `${ws.user.name} deleted this chat.`,
        chatId,
      },
      connectionId,
    );
    return;
  } else if (existingChat && type === "updated") {
    broadcastToFriendChat(
      chatId,
      {
        type: "friend_chat_updated",
        message: `${ws.user.name} updated this chat.`,
      },
      connectionId,
    );
    return;
  } else {
    sendToConnection(connectionId, {
      type: "error",
      message: "Invalid message.",
    });
  }
};
