import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { friendMatchRequestStatusEnum } from "../shared";
import { FriendshipTable } from "./friendship";
import { ProblemTable } from "./problem";
import { user } from "./user";
import { MatchTable } from "./match";

export const FriendMatchRequestTable = pgTable("friend_match_requests", {
  id,
  requesterUserId: text("requester_user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  recipientUserId: text("recipient_user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  friendshipId: uuid("friendship_id")
    .references(() => FriendshipTable.id, { onDelete: "cascade" })
    .notNull(),
  problemId: uuid("problem_id")
    .references(() => ProblemTable.id, { onDelete: "cascade" })
    .notNull(),
  matchId: uuid("match_id").references(() => MatchTable.id, {
    onDelete: "cascade",
  }),
  timeLimit: integer("time_limit"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  status: friendMatchRequestStatusEnum("status").notNull().default("pending"),
  createdAt,
  updatedAt,
});

export const friendMatchRequestRelations = relations(
  FriendMatchRequestTable,
  ({ one }) => ({
    requesterUser: one(user, {
      fields: [FriendMatchRequestTable.requesterUserId],
      references: [user.id],
      relationName: "friend_match_request_requester_user",
    }),
    recipientUser: one(user, {
      fields: [FriendMatchRequestTable.recipientUserId],
      references: [user.id],
      relationName: "friend_match_request_recipient_user",
    }),
    friendship: one(FriendshipTable, {
      fields: [FriendMatchRequestTable.friendshipId],
      references: [FriendshipTable.id],
    }),
    problem: one(ProblemTable, {
      fields: [FriendMatchRequestTable.problemId],
      references: [ProblemTable.id],
    }),
    match: one(MatchTable, {
      fields: [FriendMatchRequestTable.matchId],
      references: [MatchTable.id],
    }),
  }),
);
