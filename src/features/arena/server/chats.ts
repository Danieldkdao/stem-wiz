import { db } from "@/db/db";
import { ChatMessageTable, user } from "@/db/schema";
import { RealtimeWebSocket } from "@/features/realtime/lib/types";
import {
  sendToConnection,
  sendToUser,
} from "@/features/realtime/server/connection-state";
import { and, eq, getTableColumns } from "drizzle-orm";
import { getArenaWsState } from "./connection-state";
import { broadcastToMatchObservers } from "./match-observers";

export const broadcastChatMessageSent = async (
  ws: RealtimeWebSocket,
  matchId: string,
  chat: {
    messageId: string;
    chatId: string;
  },
) => {
  const { activeObserversByUser } = getArenaWsState();
  const userId = ws.user.id;

  if (activeObserversByUser.get(userId)?.matchId !== matchId) {
    sendToConnection(ws.id, {
      type: "error",
      message: "You are not allowed to send a chat message.",
    });
    return;
  }

  const [existingMessage] = await db
    .select({
      ...getTableColumns(ChatMessageTable),
      user: getTableColumns(user),
    })
    .from(ChatMessageTable)
    .innerJoin(user, eq(user.id, ChatMessageTable.userId))
    .where(
      and(
        eq(ChatMessageTable.chatId, chat.chatId),
        eq(ChatMessageTable.id, chat.messageId),
      ),
    );

  if (!existingMessage) {
    sendToUser(userId, {
      type: "error",
      message: "No chat message was created.",
    });
    return;
  }

  broadcastToMatchObservers(matchId, {
    type: "new_chat_message",
    message: existingMessage,
  });
};
