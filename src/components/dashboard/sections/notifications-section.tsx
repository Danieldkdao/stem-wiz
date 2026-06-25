import { ErrorState } from "@/components/error-state";
import { getUserNotificationsAction } from "@/features/notifications/actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Suspense } from "react";
import { DashboardSection } from "../dashboard-section";
import { BellIcon } from "lucide-react";
import { NotificationPayload } from "@/db/shared";
import { cn, formatTime } from "@/lib/utils";
import Link from "next/link";
import { EmptyState } from "../empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export const NotificationsSection = () => {
  return (
    <Suspense fallback={<NotificationsSectionLoading />}>
      <NotificationsSectionSuspense />
    </Suspense>
  );
};

const NotificationsSectionLoading = () => {
  return (
    <DashboardSection icon={BellIcon} title="Notifications">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-0 items-start gap-3 border-b p-4 last:border-b-0"
        >
          <Skeleton className="mt-1 size-2.5 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </DashboardSection>
  );
};

const NotificationsSectionSuspense = async () => {
  const response = await getUserNotificationsAction(DEFAULT_PAGE);
  if (!response)
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );

  const { notificationListItems } = response;

  const getNotificationHref = (payload: NotificationPayload) => {
    switch (payload.type) {
      case "friend_request_sent":
        return `/community/user/${payload.fromUserId}`;
      case "friend_request_accepted":
        return `/community/user/${payload.acceptedByUserId}`;
      case "friend_request_rejected":
        return `/community/user/${payload.rejectedByUserId}`;
      case "new_chat":
        return `/community/chats/${payload.chatId}`;
      case "community_problem_shared_with_you":
        return `/community/problems/${payload.communityProblemId}`;
      case "new_match_request":
      case "match_request_accepted":
      case "match_request_rejected":
      case "match_request_cancelled":
        return "/match-invitations/requests";
      case "new_match_observer_invitation":
      case "match_observer_invitation_accepted":
      case "match_observer_invitation_rejected":
      case "match_observer_invitation_revoked":
        return "/match-invitations/observer-invitations";
      default:
        return null;
    }
  };

  return (
    <DashboardSection icon={BellIcon} title="Notifications">
      {notificationListItems.length ? (
        notificationListItems.slice(0, 3).map((notification) => {
          const href = getNotificationHref(notification.payload);
          const content = (
            <div className="flex min-w-0 items-start gap-3 border-b p-4 last:border-b-0">
              <div
                className={cn(
                  "mt-1 size-2.5 shrink-0 rounded-full",
                  notification.readAt ? "bg-muted" : "bg-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold">
                    {notification.title}
                  </h3>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {formatTime(notification.createdAt)}
                </p>
              </div>
            </div>
          );

          return href ? (
            <Link key={notification.id} href={href}>
              {content}
            </Link>
          ) : (
            <div key={notification.id}>{content}</div>
          );
        })
      ) : (
        <EmptyState
          icon={BellIcon}
          title="No notifications"
          description="Updates and invitations will appear here."
          compact
        />
      )}
    </DashboardSection>
  );
};
