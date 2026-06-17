import { pgTable, primaryKey, text, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./user";
import { MatchTable } from "./match";
import { relations } from "drizzle-orm";

export const UserMatchTable = pgTable(
  "user_matches",
  {
    userId: varchar("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    matchId: uuid("match_id")
      .references(() => MatchTable.id, { onDelete: "cascade" })
      .notNull(),
    code: text("code"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.matchId] })],
);

export const userMatchRelations = relations(UserMatchTable, ({ one }) => ({
  user: one(user, {
    fields: [UserMatchTable.userId],
    references: [user.id],
  }),
  match: one(MatchTable, {
    fields: [UserMatchTable.matchId],
    references: [MatchTable.id],
  }),
}));
