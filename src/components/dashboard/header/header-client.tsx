"use client";

import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { NotificationListItem } from "@/features/notifications/lib/types";
import { BellIcon } from "lucide-react";
import { useEffect } from "react";
import { TooltipWrapper } from "../../tooltip-wrapper";
import { Button } from "../../ui/button";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
            <span className="absolute size-5 rounded-full bg-destructive text-white font-semibold -top-1 text-sm -right-1 flex items-center justify-center">
              {notifications.length}
            </span>
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent align="end" className="flex flex-col gap-2 w-80">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="w-full rounded-md bg-muted p-4 flex flex-col gap-0.5"
          >
            <h2 className="text-lg font-semibold">{notification.title}</h2>
            <p className="text-muted-foreground">{notification.message}</p>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};
