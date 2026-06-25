import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardCardInfoAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  ClockIcon,
  LucideIcon,
  SparklesIcon,
  SwordsIcon,
} from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const InfoCardGridSection = () => {
  return (
    <Suspense fallback={<InfoCardGridSectionLoading />}>
      <InfoCardGridSectionSuspense />
    </Suspense>
  );
};

const InfoCardGridSectionLoading = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="py-0">
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="size-16 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-28 max-w-full" />
              <Skeleton className="h-9 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const InfoCardGridSectionSuspense = async () => {
  const response = await getDashboardCardInfoAction();
  if (!response)
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );

  const {
    activeMatchCount,
    oracleSessionCount,
    pendingMatchInvitationCount,
    unreadNotificationCount,
  } = response;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={SwordsIcon}
        title="Active Matches"
        value={activeMatchCount}
        accentClassName="bg-primary/15 text-primary"
      />
      <StatCard
        icon={ClockIcon}
        title="Pending Invites"
        value={pendingMatchInvitationCount}
        accentClassName="bg-warning/15 text-warning"
      />
      <StatCard
        icon={SparklesIcon}
        title="Oracle Sessions"
        value={oracleSessionCount}
        accentClassName="bg-accent/15 text-accent"
      />
      <StatCard
        icon={BellIcon}
        title="Unread Notifications"
        value={unreadNotificationCount}
        accentClassName={cn(
          unreadNotificationCount
            ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground",
        )}
      />
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  accentClassName,
}: {
  icon: LucideIcon;
  title: string;
  value: number;
  accentClassName: string;
}) => {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-md",
            accentClassName,
          )}
        >
          <Icon className="size-8" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};
