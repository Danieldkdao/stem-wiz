import { pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const matchStatuses = ["in-progress", "finished"] as const;
export type MatchStatusType = (typeof matchStatuses)[number];
export const matchStatusEnum = pgEnum("match_statuses", matchStatuses);

export const MatchTable = pgTable("matches", {
  id,
  user1Id: varchar("user_1_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  user2Id: varchar("user_2_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  status: matchStatusEnum("status").notNull(),
  createdAt,
  updatedAt,
});

export const matchRelations = relations(MatchTable, ({ one }) => ({
  user1: one(user, {
    fields: [MatchTable.user1Id],
    references: [user.id],
    relationName: "match_user_1_relation",
  }),
  user2: one(user, {
    fields: [MatchTable.user2Id],
    references: [user.id],
    relationName: "match_user_2_relation",
  }),
}));
