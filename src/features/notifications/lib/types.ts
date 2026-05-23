import { NotificationTable } from "@/db/schema";

export type NotificationServerMessage =
  | {
      type: "new_notification";
      notification: NotificationListItem;
    }
  | {
      type: "error";
      message: string;
    };
export type NotificationServerMessageType = NotificationServerMessage["type"];

export type NotificationListItem = typeof NotificationTable.$inferSelect & {
  title: string;
  message: string;
};
