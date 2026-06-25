import { ErrorState } from "@/components/error-state";
import { getUserMatchObserverInvitationsAction } from "@/features/matches/actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Suspense } from "react";
import { DashboardSection } from "../dashboard-section";
import { EyeIcon, RadioIcon } from "lucide-react";
import { ResourceRow } from "../resource-row";
import { Badge } from "@/components/ui/badge";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { formatShortDate } from "@/lib/utils";
import { EmptyState } from "../empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export const ObserverInvitationsSection = () => {
  return (
    <Suspense fallback={<ObserverInvitationsSectionLoading />}>
      <ObserverInvitationsSectionSuspense />
    </Suspense>
  );
};

const ObserverInvitationsSectionLoading = () => {
  return (
    <DashboardSection
      icon={RadioIcon}
      title="Observer Invitations"
      href="/match-invitations/observer-invitations"
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
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-24 shrink-0" />
        </div>
      ))}
    </DashboardSection>
  );
};

const ObserverInvitationsSectionSuspense = async () => {
  const response = await getUserMatchObserverInvitationsAction({
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

  const { matchObserverInvitations } = response;

  return (
    <DashboardSection
      icon={RadioIcon}
      title="Observer Invitations"
      href="/match-invitations/observer-invitations"
    >
      {matchObserverInvitations.length ? (
        matchObserverInvitations.slice(0, 3).map((invitation) => (
          <ResourceRow
            key={invitation.id}
            href="/match-invitations/observer-invitations"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-xl font-semibold">
                  {invitation.problem.title}
                </h3>
                <Badge variant="outline">{invitation.status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {invitation.participants
                    .map((participant) => participant.user.name)
                    .join(" vs ")}
                </span>
                <span>/</span>
                <span>
                  {formatProgrammingLanguage(
                    invitation.problem.programmingLanguage,
                  )}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {formatShortDate(invitation.createdAt)}
            </span>
          </ResourceRow>
        ))
      ) : (
        <EmptyState
          icon={EyeIcon}
          title="No observer invitations"
          description="Invitations to watch friend challenges will show up here."
        />
      )}
    </DashboardSection>
  );
};
