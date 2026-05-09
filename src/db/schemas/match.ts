import { relations } from "drizzle-orm";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";

export const matchStatuses = ["in-progress", "finished"] as const;
export type MatchStatusType = (typeof matchStatuses)[number];
export const matchStatusEnum = pgEnum("match_statuses", matchStatuses);

export const MatchTable = pgTable("matches", {
  id,
  status: matchStatusEnum("status").notNull(),
  createdAt,
  updatedAt,
});

export const matchRelations = relations(MatchTable, ({ many }) => ({
  users: many(MatchTable),
}));
