import { useEffect, useState } from "react";
import { NotificationListItem } from "../lib/types";
import { useNotificationsSocket } from "./use-notifications-socket";
import { useRouter } from "next/navigation";

export const useNotifications = (
  initialNotifications: NotificationListItem[],
) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationListItem[]>(
    initialNotifications ?? [],
  );
  const { subscribeNotificationEvent } = useNotificationsSocket();

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    const unsubscribe = subscribeNotificationEvent(
      "new_notification",
      (event) => {
        setNotifications((prev) => [event.notification, ...prev]);
        router.refresh();
      },
    );

    return () => {
      unsubscribe();
    };
  }, [subscribeNotificationEvent]);

  return notifications;
};
