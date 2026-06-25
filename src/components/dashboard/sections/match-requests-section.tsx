import { ErrorState } from "@/components/error-state";
import { getUserMatchRequestsAction } from "@/features/matches/actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { DashboardSection } from "../dashboard-section";
import { InboxIcon, MailIcon } from "lucide-react";
import { formatMatchRequestStatus } from "@/features/matches/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { ResourceRow } from "../resource-row";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { formatShortDate } from "@/lib/utils";
import { EmptyState } from "../empty-state";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const MatchRequestsSection = () => {
  return (
    <Suspense fallback={<MatchRequestsSectionLoading />}>
      <MatchRequestsSectionSuspense />
    </Suspense>
  );
};

const MatchRequestsSectionLoading = () => {
  return (
    <DashboardSection
      icon={MailIcon}
      title="Match Requests"
      href="/match-invitations/requests"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-0 flex-col gap-3 border-b p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-32 shrink-0" />
        </div>
      ))}
    </DashboardSection>
  );
};

const MatchRequestsSectionSuspense = async () => {
  const response = await getUserMatchRequestsAction({
    search: "",
    sortBy: "most_recent",
    filterBy: "received",
    statuses: ["pending"],
    page: DEFAULT_PAGE,
  });
  if (!response)
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );

  const { matchRequests } = response;

  return (
    <DashboardSection
      icon={MailIcon}
      title="Match Requests"
      href="/match-invitations/requests"
    >
      {matchRequests.length ? (
        matchRequests.slice(0, 3).map((request) => (
          <ResourceRow key={request.id} href="/match-invitations/requests">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-xl font-semibold">
                  {request.problem.title}
                </h3>
                <Badge variant="outline">
                  {formatMatchRequestStatus(request.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>from {request.friend.name}</span>
                <span>/</span>
                <span>
                  {formatProgrammingLanguage(
                    request.problem.programmingLanguage,
                  )}
                </span>
                <span>/</span>
                <span>
                  {formatDifficultyLevel(request.problem.difficultyLevel)}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {request.expiresAt
                ? `Expires ${formatShortDate(request.expiresAt)}`
                : "No expiration"}
            </span>
          </ResourceRow>
        ))
      ) : (
        <EmptyState
          icon={InboxIcon}
          title="No pending match requests"
          description="Friend challenges you receive will appear here."
        />
      )}
    </DashboardSection>
  );
};
