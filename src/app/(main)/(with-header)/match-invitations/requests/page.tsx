import { ErrorState } from "@/components/error-state";
import { RefreshPageButton } from "@/components/refresh-page-button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserMatchRequestsAction } from "@/features/matches/actions/actions";
import { MatchRequestFilters } from "@/features/matches/components/match-request-filters";
import { MatchRequestInfiniteCardGrid } from "@/features/matches/components/match-request-infinite-card-grid";
import { loadMatchRequestSearchParams } from "@/features/matches/lib/match-request-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type RequestsParams = { searchParams: Promise<SearchParams> };

const RequestsPage = (props: RequestsParams) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Match Requests</h1>
      <Suspense fallback={<RequestsLoading />}>
        <RequestsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const RequestsLoading = () => {
  return (
    <div className="flex flex-col gap-6">
      <InvitationFiltersSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <MatchRequestCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

const InvitationFiltersSkeleton = () => {
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

const MatchRequestCardSkeleton = () => {
  return (
    <Card className="h-full w-full min-w-0 border-t-4 border-t-muted">
      <CardContent className="flex h-full w-full min-w-0 flex-col gap-4">
        <div className="flex w-full min-w-0 items-start gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-36 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 shrink-0 rounded-4xl" />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2">
          <Skeleton className="h-8 w-4/5" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <Separator />
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
};

const RequestsSuspense = async ({ searchParams }: RequestsParams) => {
  const filters = await loadMatchRequestSearchParams(searchParams);
  const response = await getUserMatchRequestsAction({
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="Failed to get match requests"
        description="Due to an unexpected error, we were unable to find your match requests. Try refreshing the page or come back later."
      >
        <RefreshPageButton variant="outline" className="w-full">
          Refresh the page
        </RefreshPageButton>
      </ErrorState>
    );
  }

  const { matchRequests, metadata } = response;

  return (
    <div className="flex flex-col gap-6">
      <MatchRequestFilters />
      <MatchRequestInfiniteCardGrid
        initialMatchRequests={matchRequests}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default RequestsPage;
