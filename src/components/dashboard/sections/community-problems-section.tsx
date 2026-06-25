import { ErrorState } from "@/components/error-state";
import { getCommunityProblemsAction } from "@/features/social/actions/actions";
import { getCurrentUser } from "@/lib/auth/helpers";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Suspense } from "react";
import { DashboardSection } from "../dashboard-section";
import { FileCode2Icon } from "lucide-react";
import { ResourceRow } from "../resource-row";
import {
  formatCommunityProblemStatus,
  formatProgrammingLanguage,
} from "@/features/social/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { formatShortDate } from "@/lib/utils";
import { EmptyState } from "../empty-state";
import { LinkButton } from "@/components/link-button";
import { Skeleton } from "@/components/ui/skeleton";

export const CommunityProblemsSection = () => {
  return (
    <Suspense fallback={<CommunityProblemsSectionLoading />}>
      <CommunityProblemsSectionSuspense />
    </Suspense>
  );
};

const CommunityProblemsSectionLoading = () => {
  return (
    <DashboardSection
      icon={FileCode2Icon}
      title="Community Problems"
      href="/community/problems"
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
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-28 shrink-0" />
        </div>
      ))}
    </DashboardSection>
  );
};

const CommunityProblemsSectionSuspense = async () => {
  const { userId } = await getCurrentUser();
  if (!userId)
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );
  const { communityProblems } = await getCommunityProblemsAction(userId, {
    search: "",
    sortBy: "most_recent",
    languages: [],
    difficulty: [],
    statuses: [],
    page: DEFAULT_PAGE,
  });

  return (
    <DashboardSection
      icon={FileCode2Icon}
      title="Community Problems"
      href="/community/problems"
    >
      {communityProblems.length ? (
        communityProblems.slice(0, 3).map((communityProblem) => (
          <ResourceRow
            key={communityProblem.id}
            href={`/community/problems/${communityProblem.id}`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-xl font-semibold">
                  {communityProblem.problem.title}
                </h3>
                <Badge variant="outline">
                  {formatCommunityProblemStatus(communityProblem.status).label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {formatProgrammingLanguage(
                    communityProblem.problem.programmingLanguage,
                  )}
                </span>
                <span>/</span>
                <span>
                  {formatDifficultyLevel(
                    communityProblem.problem.difficultyLevel,
                  )}
                </span>
                <span>/</span>
                <span>by {communityProblem.author.name}</span>
              </div>
            </div>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              Updated {formatShortDate(communityProblem.updatedAt)}
            </span>
          </ResourceRow>
        ))
      ) : (
        <EmptyState
          icon={FileCode2Icon}
          title="No community problems"
          description="Create or discover practice problems from the community."
        >
          <LinkButton href="/community/problems" size="sm">
            Browse problems
          </LinkButton>
        </EmptyState>
      )}
    </DashboardSection>
  );
};
