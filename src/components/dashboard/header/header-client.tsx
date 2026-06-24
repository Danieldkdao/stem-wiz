"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getUserNotificationsAction } from "@/features/notifications/actions/actions";
import { MarkNotificationsReadButton } from "@/features/notifications/components/mark-all-read-button";
import { Notification } from "@/features/notifications/components/notification";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { NotificationListItem } from "@/features/notifications/lib/types";
import { DEFAULT_PAGE } from "@/lib/constants";
import { BellIcon, BellOffIcon, Loader2Icon } from "lucide-react";
import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { TooltipWrapper } from "../../tooltip-wrapper";
import { Button } from "../../ui/button";

export const HeaderClient = ({
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

  const unreadCount = optimisticNotifications.filter(
    (notification) => !notification.readAt,
  ).length;

  return (
    <Popover>
      <TooltipWrapper content="Your notifications" align="end">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="size-6!" />
            {unreadCount > 0 && (
              <span className="absolute size-5 rounded-full bg-destructive text-white font-semibold -top-1 text-sm -right-1 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent
        align="end"
        className="flex flex-col gap-2 w-80 max-h-[calc(100dvh-8rem)] min-h-0"
      >
        {optimisticNotifications.length ? (
          <div className="flex flex-col gap-2 w-full min-h-0">
            <MarkNotificationsReadButton
              className="w-full"
              variant="outline"
              disabled={optimisticNotifications.every(
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
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <BellOffIcon />
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-medium text-center">
                No notifications
              </h2>
              <p className="text-center text-muted-foreground">
                You don't have any notifications yet.
              </p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
