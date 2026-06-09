"use client";

import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { NotificationListItem } from "@/features/notifications/lib/types";
import { BellIcon, BellOffIcon } from "lucide-react";
import { useEffect } from "react";
import { TooltipWrapper } from "../../tooltip-wrapper";
import { Button } from "../../ui/button";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getNotificationChildren } from "@/features/notifications/lib/formatters";
import { formatTime } from "@/lib/utils";

export const HeaderClient = ({
  initialNotifications,
}: {
  initialNotifications: NotificationListItem[];
}) => {
  const { connect, status } = useNotificationsSocket();
  const notifications = useNotifications(initialNotifications);

  useEffect(() => {
    if (status === "open" || status === "connecting") return;

    connect();
  }, [status]);

  return (
    <Popover>
      <TooltipWrapper content="Your notifications" align="end">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="size-6!" />
            {notifications.length > 0 && (
              <span className="absolute size-5 rounded-full bg-destructive text-white font-semibold -top-1 text-sm -right-1 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent align="end" className="flex flex-col gap-2 w-80">
        {notifications.length ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="w-full rounded-md bg-muted p-4 flex flex-col gap-2 relative"
            >
              <div className="size-4 rounded-full bg-primary absolute -right-1 -top-1" />

              <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-semibold">{notification.title}</h2>
                <span className="text-muted-foreground text-sm">
                  {formatTime(notification.createdAt)}
                </span>
                <p className="text-muted-foreground">{notification.message}</p>
              </div>
              {getNotificationChildren(notification.payload)}
            </div>
          ))
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
