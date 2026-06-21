import { pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { createdAt } from "../helpers";
import { MatchTable } from "./match";
import { MatchObserverInvitationTable } from "./match-observer-invitation";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const MatchObserverTable = pgTable(
  "match_observers",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    matchId: uuid("match_id")
      .references(() => MatchTable.id, { onDelete: "cascade" })
      .notNull(),
    invitationId: uuid("invitation_id")
      .references(() => MatchObserverInvitationTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    invitedByUserId: text("invited_by_user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    createdAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.matchId] })],
);

export const matchObserverRelations = relations(
  MatchObserverTable,
  ({ one }) => ({
    user: one(user, {
      fields: [MatchObserverTable.userId],
      references: [user.id],
      relationName: "match_observer_user",
    }),
    invitedByUser: one(user, {
      fields: [MatchObserverTable.invitedByUserId],
      references: [user.id],
      relationName: "match_observer_invited_by_user",
    }),
    match: one(MatchTable, {
      fields: [MatchObserverTable.matchId],
      references: [MatchTable.id],
    }),
    invitation: one(MatchObserverInvitationTable, {
      fields: [MatchObserverTable.invitationId],
      references: [MatchObserverInvitationTable.id],
    }),
  }),
);
