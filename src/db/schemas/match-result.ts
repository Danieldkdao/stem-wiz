import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { MatchTable } from "./match";
import { matchResultEnum } from "../shared";
import { user } from "./user";
import { createdAt, updatedAt } from "../helpers";
import { relations } from "drizzle-orm";

export const MatchResultTable = pgTable("match_results", {
  matchId: uuid("match_id")
    .references(() => MatchTable.id, { onDelete: "cascade" })
    .primaryKey(),
  result: matchResultEnum("result").notNull(),
  winnerId: text("winner_id").references(() => user.id, {
    onDelete: "cascade",
  }),
  createdAt,
  updatedAt,
});

export const matchResultRelations = relations(MatchResultTable, ({ one }) => ({
  match: one(MatchTable, {
    fields: [MatchResultTable.matchId],
    references: [MatchTable.id],
  }),
  user: one(user, {
    fields: [MatchResultTable.winnerId],
    references: [user.id],
  }),
}));
