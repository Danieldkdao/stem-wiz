"use client";

import { formatTime } from "@/lib/utils";
import { getNotificationChildren } from "../lib/formatters";
import { NotificationListItem } from "../lib/types";
import { MarkNotificationsReadButton } from "./mark-all-read-button";
import { CheckIcon } from "lucide-react";
import { TooltipWrapper } from "@/components/tooltip-wrapper";

export const Notification = ({
  notification,
  onMarkRead,
}: {
  notification: NotificationListItem;
  onMarkRead: () => void;
}) => {
  return (
    <div className="w-full rounded-md bg-muted p-4 flex flex-col gap-2 relative">
      {!notification.readAt && (
        <div className="size-4 rounded-full bg-primary absolute -right-1 -top-1" />
      )}

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <h2 className="text-lg font-semibold">{notification.title}</h2>
          {!notification.readAt && (
            <TooltipWrapper content="Mark as read">
              <MarkNotificationsReadButton
                notificationId={notification.id}
                variant="outline"
                size="icon-sm"
                onMarkOptimisticRead={onMarkRead}
              >
                <CheckIcon className="text-emerald-500" />
              </MarkNotificationsReadButton>
            </TooltipWrapper>
          )}
        </div>
        <span className="text-muted-foreground text-sm">
          {formatTime(notification.createdAt)}
        </span>
        <p className="text-muted-foreground">{notification.message}</p>
      </div>
      {getNotificationChildren(notification.payload)}
    </div>
  );
};
