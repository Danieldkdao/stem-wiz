import { relations } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { ChatMessageTable } from "./chat-message";
import { MatchTable } from "./match";

export const ChatTable = pgTable("chats", {
  id,
  matchId: uuid("match_id")
    .references(() => MatchTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  // todo: for dev meetups and social part of this application, implement friend chats
  createdAt,
});

export const chatRelations = relations(ChatTable, ({ one, many }) => ({
  matchId: one(MatchTable, {
    fields: [ChatTable.matchId],
    references: [MatchTable.id],
  }),
  messages: many(ChatMessageTable),
}));
