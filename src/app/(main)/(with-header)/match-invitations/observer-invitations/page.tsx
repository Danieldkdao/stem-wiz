import { ErrorState } from "@/components/error-state";
import { RefreshPageButton } from "@/components/refresh-page-button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserMatchObserverInvitationsAction } from "@/features/matches/actions/actions";
import { MatchObserverInvitationFilters } from "@/features/matches/components/match-observer-invitation-filters";
import { MatchObserverInvitationInfiniteCardGrid } from "@/features/matches/components/match-observer-invitation-infinite-card-grid";
import { loadMatchObserverInvitationSearchParams } from "@/features/matches/lib/match-observer-invitation-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type ObserverInvitationsParams = { searchParams: Promise<SearchParams> };

const ObserverInvitationsPage = (props: ObserverInvitationsParams) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Match Observer Invitations</h1>
      <Suspense fallback={<ObserverInvitationsLoading />}>
        <ObserverInvitationsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const ObserverInvitationsLoading = () => {
  return (
    <div className="flex flex-col gap-6">
      <ObserverInvitationFiltersSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ObserverInvitationCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

const ObserverInvitationFiltersSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-4">
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>
    </div>
  );
};

const ObserverInvitationCardSkeleton = () => {
  return (
    <Card className="h-full min-w-0">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-4xl" />
          <Skeleton className="h-6 w-24 rounded-4xl" />
          <Skeleton className="ml-auto h-6 w-20 rounded-4xl" />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>

      <CardContent className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-28 max-w-full" />
            </div>
            <Skeleton className="h-4 w-6 shrink-0" />
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <Skeleton className="h-5 w-28 max-w-full" />
              <Skeleton className="size-8 shrink-0 rounded-full" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-4xl" />
            <Skeleton className="h-6 w-16 rounded-4xl" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-6 w-20 rounded-4xl" />
            <Skeleton className="h-6 w-24 rounded-4xl" />
            <Skeleton className="h-6 w-10 rounded-4xl" />
          </div>
        </div>

        <Separator />

        <div className="grid gap-2 text-sm">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto border-t pt-6">
        <Skeleton className="h-9 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
};

const ObserverInvitationsSuspense = async ({
  searchParams,
}: ObserverInvitationsParams) => {
  const filters = await loadMatchObserverInvitationSearchParams(searchParams);

  const response = await getUserMatchObserverInvitationsAction({
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="An unexpected error occurred"
        description="We were unable to load your match observer invitations. Try refreshing the page or come back later if the issue persists."
      >
        <RefreshPageButton variant="outline" className="w-full">
          Reload the page
        </RefreshPageButton>
      </ErrorState>
    );
  }

  const { currentUserId, matchObserverInvitations, metadata } = response;

  return (
    <div className="flex flex-col gap-6">
      <MatchObserverInvitationFilters />
      <MatchObserverInvitationInfiniteCardGrid
        currentUserId={currentUserId}
        initialMatchObserverInvitations={matchObserverInvitations}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default ObserverInvitationsPage;
