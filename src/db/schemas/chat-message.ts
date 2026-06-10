import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { ChatTable } from "./chat";
import { user } from "./user";
import { chatMessageRoleEnum, chatMessageStatusEnum } from "../shared";

export const ChatMessageTable = pgTable("chat-messages", {
  id,
  role: chatMessageRoleEnum("role").notNull().default("user"),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  chatId: uuid("chat_id")
    .references(() => ChatTable.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  status: chatMessageStatusEnum("status").notNull().default("created"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
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
