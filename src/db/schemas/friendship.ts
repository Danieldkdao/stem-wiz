import { relations, sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { ChatTable } from "./chat";
import { FriendRequestTable } from "./friend-request";
import { user } from "./user";
import { CommunityProblemInvitationTable } from "./community-problem-invitation";

export const FriendshipTable = pgTable(
  "friendships",
  {
    id,
    userOneId: text("user_one_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    userTwoId: text("user_two_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    createdFromFriendRequestId: uuid(
      "created_from_friend_request_id",
    ).references(() => FriendRequestTable.id, { onDelete: "set null" }),
    createdAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("friendships_unique_active_pair")
      .on(t.userOneId, t.userTwoId)
      .where(sql`${t.deletedAt} IS NULL`),
    check(
      "friendships_no_self_friendship",
      sql`${t.userOneId} <> ${t.userTwoId}`,
    ),
    check("friendships_ordered_pair", sql`${t.userOneId} < ${t.userTwoId}`),
  ],
);

export const friendshipRelations = relations(
  FriendshipTable,
  ({ one, many }) => ({
    userOne: one(user, {
      fields: [FriendshipTable.userOneId],
      references: [user.id],
      relationName: "friendship_user_one",
    }),
    userTwo: one(user, {
      fields: [FriendshipTable.userTwoId],
      references: [user.id],
      relationName: "friendship_user_two",
    }),
    friendRequest: one(FriendRequestTable, {
      fields: [FriendshipTable.createdFromFriendRequestId],
      references: [FriendRequestTable.id],
    }),
    chats: many(ChatTable),
    communityProblemInvitations: many(CommunityProblemInvitationTable),
  }),
);
