import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { ChatTable } from "./chat";
import { user } from "./user";

export const ChatMessageTable = pgTable("chat-messages", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  chatId: uuid("chat_id")
    .references(() => ChatTable.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  // todo: for dev meetups and social part of this application, implement friend chats
  createdAt,
});

export const chatMessageRelations = relations(ChatMessageTable, ({ one }) => ({
  user: one(user, {
    fields: [ChatMessageTable.userId],
    references: [user.id],
  }),
  chat: one(ChatTable, {
    fields: [ChatMessageTable.chatId],
    references: [ChatTable.id],
  }),
}));
