import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { matchStatusEnum } from "../shared";
import { ArenaProblemConfigTable } from "./arena-problem-config";
import { ChatTable } from "./chat";
import { MatchResultTable } from "./match-result";
import { MatchSubmissionTable } from "./match-submission";
import { UserMatchTable } from "./user-match";
import { FriendMatchRequestTable } from "./friend-match-request";
import { MatchObserverInvitationTable } from "./match-observer-invitation";
import { MatchObserverTable } from "./match-observer";

export const MatchTable = pgTable("matches", {
  id,
  status: matchStatusEnum("status").notNull(),
  problemId: uuid("problem_id")
    .references(() => ArenaProblemConfigTable.id, { onDelete: "no action" })
    .notNull(),
  createdAt,
  updatedAt,
  expiresAt: timestamp("expires_at").notNull(),
});

export const matchRelations = relations(MatchTable, ({ one, many }) => ({
  arenaProblem: one(ArenaProblemConfigTable, {
    fields: [MatchTable.problemId],
    references: [ArenaProblemConfigTable.id],
  }),
  result: one(MatchResultTable),
  users: many(UserMatchTable),
  submissions: many(MatchSubmissionTable),
  chats: many(ChatTable),
  friendMatchRequests: many(FriendMatchRequestTable),
  matchObserverInvitations: many(MatchObserverInvitationTable),
  matchObservers: many(MatchObserverTable),
}));
