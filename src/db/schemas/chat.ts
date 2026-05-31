import { relations } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { ChatMessageTable } from "./chat-message";
import { MatchTable } from "./match";
import { OracleProblemTable } from "./oracle-problem";

export const ChatTable = pgTable("chats", {
  id,
  matchId: uuid("match_id").references(() => MatchTable.id, {
    onDelete: "cascade",
  }),
  oracleProblemId: uuid("oracle_problem_id").references(
    () => OracleProblemTable.id,
    { onDelete: "cascade" },
  ),
  // todo: for dev meetups and social part of this application, implement friend chats
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
  messages: many(ChatMessageTable),
}));
