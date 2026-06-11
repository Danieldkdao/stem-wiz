import { ChatMessageTable, ChatTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";

export type FriendChatServerMessage =
  | {
      type: "new_chat";
      chat: typeof ChatTable.$inferSelect & {
        user: User;
        messageCount: number;
      };
    }
  | {
      type: "friend_message_sent";
      message: typeof ChatMessageTable.$inferSelect & { user: User };
    }
  | {
      type: "friend_message_updated";
      message: typeof ChatMessageTable.$inferSelect & { user: User };
    }
  | {
      type: "friend_message_deleted";
      message: typeof ChatMessageTable.$inferSelect & { user: User };
    }
  | { type: "friend_chat_deleted"; message: string; chatId: string }
  | { type: "friend_chat_updated"; message: string }
  | { type: "friend_connected"; userId: string; chatId: string }
  | { type: "friend_disconnected"; userId: string; chatId: string }
  | { type: "connection_error"; message: string }
  | {
      type: "error";
      message: string;
    };
export type FriendChatServerMessageType = FriendChatServerMessage["type"];
