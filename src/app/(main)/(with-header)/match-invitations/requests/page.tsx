import { ErrorState } from "@/components/error-state";
import { RefreshPageButton } from "@/components/refresh-page-button";
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
  return <div>loading</div>;
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
