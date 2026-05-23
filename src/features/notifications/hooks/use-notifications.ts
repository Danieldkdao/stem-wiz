import { useEffect, useState } from "react";
import { NotificationListItem } from "../lib/types";
import { useNotificationsSocket } from "./use-notifications-socket";

export const useNotifications = (
  initialNotifications: NotificationListItem[],
) => {
  const [notifications, setNotifications] = useState<NotificationListItem[]>(
    initialNotifications ?? [],
  );
  const { subscribeNotificationEvent } = useNotificationsSocket();

  useEffect(() => {
    const unsubscribe = subscribeNotificationEvent(
      "new_notification",
      (event) => {
        setNotifications((prev) => [...prev, event.notification]);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [subscribeNotificationEvent]);

  return notifications;
};
