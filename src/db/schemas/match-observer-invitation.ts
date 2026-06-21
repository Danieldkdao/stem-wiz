import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { matchObserverInvitationStatusEnum } from "../shared";
import { FriendshipTable } from "./friendship";
import { MatchTable } from "./match";
import { MatchObserverTable } from "./match-observer";
import { user } from "./user";

export const MatchObserverInvitationTable = pgTable(
  "match_observer_invitations",
  {
    id,
    matchId: uuid("match_id")
      .references(() => MatchTable.id, { onDelete: "cascade" })
      .notNull(),
    inviterUserId: text("inviter_user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    invitedUserId: text("invited_user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    friendshipId: uuid("friendship_id")
      .references(() => FriendshipTable.id, { onDelete: "cascade" })
      .notNull(),
    status: matchObserverInvitationStatusEnum("status")
      .notNull()
      .default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("match_observer_invitation_unique_pending_pair")
      .on(t.invitedUserId, t.matchId)
      .where(sql`${t.status} = 'pending'`),
  ],
);

export const matchObserverInvitationRelations = relations(
  MatchObserverInvitationTable,
  ({ one }) => ({
    match: one(MatchTable, {
      fields: [MatchObserverInvitationTable.matchId],
      references: [MatchTable.id],
    }),
    friendship: one(FriendshipTable, {
      fields: [MatchObserverInvitationTable.friendshipId],
      references: [FriendshipTable.id],
    }),
    inviter: one(user, {
      fields: [MatchObserverInvitationTable.inviterUserId],
      references: [user.id],
      relationName: "match_observer_invitation_inviter_user",
    }),
    invited: one(user, {
      fields: [MatchObserverInvitationTable.invitedUserId],
      references: [user.id],
      relationName: "match_observer_invitation_invited_user",
    }),
    matchObserver: one(MatchObserverTable),
  }),
);
