import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { ChatMessageTable } from "./chat-message";
import { MatchTable } from "./match";
import { OracleProblemTable } from "./oracle-problem";
import { FriendRequestTable } from "./friend-request";

export const ChatTable = pgTable("chats", {
  id,
  title: varchar("title"),
  matchId: uuid("match_id").references(() => MatchTable.id, {
    onDelete: "cascade",
  }),
  oracleProblemId: uuid("oracle_problem_id").references(
    () => OracleProblemTable.id,
    { onDelete: "cascade" },
  ),
  friendRequestId: uuid("friend_request_id").references(
    () => FriendRequestTable.id,
    { onDelete: "cascade" },
  ),
  createdAt,
});

export const chatRelations = relations(ChatTable, ({ one, many }) => ({
  matchId: one(MatchTable, {
    fields: [ChatTable.matchId],
    references: [MatchTable.id],
  }),
  oracleProblem: one(OracleProblemTable, {
    fields: [ChatTable.oracleProblemId],
    references: [OracleProblemTable.id],
  }),
  friendRequestId: one(FriendRequestTable, {
    fields: [ChatTable.friendRequestId],
    references: [FriendRequestTable.id],
  }),
  messages: many(ChatMessageTable),
}));
