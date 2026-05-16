import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { user } from "./user";
import { MatchTable } from "./match";
import { relations } from "drizzle-orm";

export const ChatTable = pgTable("chats", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  matchId: uuid("match_id").references(() => MatchTable.id, {
    onDelete: "cascade",
  }),
  // todo: for dev meetups and social part of this application, implement friend chats
  createdAt,
});

export const chatRelations = relations(ChatTable, ({ one }) => ({
  user: one(user, {
    fields: [ChatTable.userId],
    references: [user.id],
  }),
  matchId: one(MatchTable, {
    fields: [ChatTable.matchId],
    references: [MatchTable.id],
  }),
}));
