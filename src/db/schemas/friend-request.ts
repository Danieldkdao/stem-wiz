import { relations, sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { user } from "./user";
import { friendRequestStatusEnum } from "../shared";
import { ChatTable } from "./chat";

export const FriendRequestTable = pgTable(
  "friend_requests",
  {
    id,
    fromUserId: text("from_user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    toUserId: text("to_user_id")
      .references(() => user.id, {
        onDelete: "cascade",
      })
      .notNull(),
    status: friendRequestStatusEnum("status").notNull().default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("friend_requests_unique_pending_pair")
      .on(
        sql`LEAST(${t.fromUserId}, ${t.toUserId})`,
        sql`GREATEST(${t.fromUserId}, ${t.toUserId})`,
      )
      .where(sql`${t.status} = 'pending'`),
    check(
      "friend_requests_no_self_request",
      sql`${t.fromUserId} <> ${t.toUserId}`,
    ),
  ],
);

export const friendRequestRelations = relations(
  FriendRequestTable,
  ({ one, many }) => ({
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
    chat: many(ChatTable),
  }),
);
