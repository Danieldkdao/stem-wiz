"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { NotificationListItem } from "@/features/notifications/lib/types";
import { BellIcon, BellOffIcon } from "lucide-react";
import { useEffect } from "react";
import { TooltipWrapper } from "../../tooltip-wrapper";
import { Button } from "../../ui/button";
import { NotificationsList } from "./notifications-list";

export const HeaderClient = ({
  initialNotifications,
  initialHasNextPage,
  unreadCount,
}: {
  initialNotifications: NotificationListItem[];
  initialHasNextPage: boolean;
  unreadCount: number;
}) => {
  const { connect, status } = useNotificationsSocket();

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
            {/* todo: maybe make this optimistic in the future? */}
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
        {initialNotifications.length ? (
          <NotificationsList
            initialNotifications={initialNotifications}
            initialHasNextPage={initialHasNextPage}
          />
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
