import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { user } from "./user";
import { notificationEventTypeEnum, NotificationPayload } from "../shared";
import { relations } from "drizzle-orm";

export const NotificationTable = pgTable("notifications", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  readAt: timestamp("read_at"),
  type: notificationEventTypeEnum("type").notNull(),
  payload: jsonb("payload").$type<NotificationPayload>().notNull(),
  createdAt,
});

export const notificationRelations = relations(
  NotificationTable,
  ({ one }) => ({
    user: one(user, {
      fields: [NotificationTable.userId],
      references: [user.id],
    }),
  }),
);
