import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { user } from "./user";

export const FriendRequestTable = pgTable("friend_requests", {
  id,
  fromUserId: text("from_user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  toUserId: text("to_user_id")
    .references(() => user.id, {
      onDelete: "cascade",
    })
    .notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const friendRequestRelations = relations(
  FriendRequestTable,
  ({ one }) => ({
    fromUser: one(user, {
      fields: [FriendRequestTable.fromUserId],
      references: [user.id],
      relationName: "from_user",
    }),
    toUser: one(user, {
      fields: [FriendRequestTable.toUserId],
      references: [user.id],
      relationName: "to_user",
    }),
  }),
);
