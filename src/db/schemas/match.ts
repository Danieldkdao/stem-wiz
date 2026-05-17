import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { matchStatusEnum } from "../shared";
import { ArenaProblemTable } from "./arena-problem";
import { ChatTable } from "./chat";
import { MatchResultTable } from "./match-result";
import { MatchSubmissionTable } from "./match-submission";
import { UserMatchTable } from "./user-match";

export const MatchTable = pgTable("matches", {
  id,
  status: matchStatusEnum("status").notNull(),
  problemId: uuid("problem_id")
    .references(() => ArenaProblemTable.id, { onDelete: "no action" })
    .notNull(),
  createdAt,
  updatedAt,
  expiresAt: timestamp("expires_at").notNull(),
});

export const matchRelations = relations(MatchTable, ({ one, many }) => ({
  arenaProblem: one(ArenaProblemTable, {
    fields: [MatchTable.problemId],
    references: [ArenaProblemTable.id],
  }),
  result: one(MatchResultTable),
  users: many(UserMatchTable),
  submissions: many(MatchSubmissionTable),
  chats: many(ChatTable),
}));
