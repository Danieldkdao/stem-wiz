import { pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./user";
import { MatchTable } from "./match";
import { createdAt, updatedAt } from "../helpers";
import { relations } from "drizzle-orm";

export const MatchSubmissionTable = pgTable(
  "match_submissions",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    matchId: uuid("match_id")
      .references(() => MatchTable.id, { onDelete: "cascade" })
      .notNull(),
    code: text("code").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.matchId] })],
);

export const matchSubmissionRelations = relations(
  MatchSubmissionTable,
  ({ one }) => ({
    user: one(user, {
      fields: [MatchSubmissionTable.userId],
      references: [user.id],
    }),
    match: one(MatchTable, {
      fields: [MatchSubmissionTable.matchId],
      references: [MatchTable.id],
    }),
  }),
);
