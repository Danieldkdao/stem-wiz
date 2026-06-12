"use client";

import { getUserNotificationsAction } from "@/features/notifications/actions/actions";
import { MarkNotificationsReadButton } from "@/features/notifications/components/mark-all-read-button";
import { Notification } from "@/features/notifications/components/notification";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { NotificationListItem } from "@/features/notifications/lib/types";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Loader2Icon } from "lucide-react";
import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";

export const NotificationsList = ({
  initialNotifications,
  initialHasNextPage,
}: {
  initialNotifications: NotificationListItem[];
  initialHasNextPage: boolean;
}) => {
  const { notifications, setNotifications } =
    useNotifications(initialNotifications);
  const [optimisticNotifications, markOptismisticRead] = useOptimistic(
    notifications,
    (current, notificationId?: string) => {
      const readAt = new Date();

      return current.map((notification) => {
        if (!notificationId || notification.id === notificationId) {
          return { ...notification, readAt };
        }

        return notification;
      });
    },
  );
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(initialNotifications);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialNotifications, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getUserNotificationsAction(nextPage);
          if (!response) return;
          const { notificationListItems, metadata } = response;
          setNotifications((prev) => [...prev, ...notificationListItems]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      {
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [isPending, hasNextPage, sentinelRef.current]);

  return (
    <div className="flex flex-col gap-2 w-full min-h-0">
      <MarkNotificationsReadButton
        className="w-full"
        variant="outline"
        disabled={notifications.every(
          (notification) => notification.readAt !== null,
        )}
        onMarkOptimisticRead={() => markOptismisticRead(undefined)}
      >
        Mark all as read
      </MarkNotificationsReadButton>
      <div className="flex flex-col gap-2 flex-1 w-full overflow-y-auto p-1">
        {optimisticNotifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onMarkRead={() => markOptismisticRead(notification.id)}
          />
        ))}
        <div ref={sentinelRef} className="h-1 w-full bg-transparent" />
        {isPending && (
          <div className="flex items-center justify-center w-full">
            <Loader2Icon className="text-primary animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
