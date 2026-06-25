import { ErrorState } from "@/components/error-state";
import { getUserMatchesAction } from "@/features/matches/actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SwordsIcon } from "lucide-react";
import { Suspense } from "react";
import { DashboardSection } from "../dashboard-section";
import { ResourceRow } from "../resource-row";
import { Badge } from "@/components/ui/badge";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "../empty-state";
import { LinkButton } from "@/components/link-button";
import { Skeleton } from "@/components/ui/skeleton";

export const MatchListSection = () => {
  return (
    <Suspense fallback={<MatchListSectionLoading />}>
      <MatchListSectionSuspense />
    </Suspense>
  );
};

const MatchListSectionLoading = () => {
  return (
    <DashboardSection icon={SwordsIcon} title="Matches" href="/matches">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-0 flex-col gap-3 border-b p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </DashboardSection>
  );
};

const MatchListSectionSuspense = async () => {
  const response = await getUserMatchesAction({
    search: "",
    sortBy: "expires_soon",
    filterBy: "in_progress",
    results: [],
    completionReasons: [],
    kind: "all",
    page: DEFAULT_PAGE,
    limit: 3,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );
  }
  const { matches } = response;

  return (
    <DashboardSection icon={SwordsIcon} title="Matches" href="/matches">
      {matches.length ? (
        matches.slice(0, 3).map((match) => (
          <ResourceRow key={match.id} href={`/arena/matches/${match.id}`}>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-xl font-semibold">
                  {match.arenaProblem.problem.title}
                </h3>
                <Badge variant="secondary">
                  {match.kind === "arena" ? "Arena" : "Friend Challenge"}
                </Badge>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>vs {match.opponent.name}</span>
                <span>/</span>
                <span>
                  {formatProgrammingLanguage(
                    match.arenaProblem.problem.programmingLanguage,
                  )}
                </span>
                <span>/</span>
                <span>
                  {formatDifficultyLevel(
                    match.arenaProblem.problem.difficultyLevel,
                  )}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge>
                {match.expiresAt
                  ? `${formatDistanceToNow(match.expiresAt)} left`
                  : "No time limit"}
              </Badge>
              <span className="text-sm font-medium text-primary">Resume</span>
            </div>
          </ResourceRow>
        ))
      ) : (
        <EmptyState
          icon={SwordsIcon}
          title="No active matches"
          description="Start a live coding challenge when you are ready."
        >
          <LinkButton href="/arena/waiting" size="sm">
            Find a match
          </LinkButton>
        </EmptyState>
      )}
    </DashboardSection>
  );
};
