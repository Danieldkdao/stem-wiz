import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getObservableMatchesAction } from "@/features/matches/actions/actions";
import { MatchObserverListStatus } from "@/features/matches/components/match-observer-list-status";
import { loadObservableMatchSearchParams } from "@/features/matches/lib/observable-params";
import { ObservableMatchFilters } from "@/features/matches/components/observable-match-filters";
import { ObservableMatchInfiniteCardGrid } from "@/features/matches/components/observable-match-infinite-card-grid";
import { DEFAULT_PAGE } from "@/lib/constants";
import { connection } from "next/server";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type ObserveMatchesListParams = {
  searchParams: Promise<SearchParams>;
};

const ObserveMatchesListPage = (props: ObserveMatchesListParams) => {
  return (
    <div className="flex flex-col gap-4 py-10 px-6 w-full h-full overflow-auto">
      <div className="flex flex-col gap-2 items-center">
        <MatchObserverListStatus />
        <h1 className="text-2xl font-semibold text-center">Observe</h1>
        <p className="text-muted-foreground text-center">
          Find some ongoing matches to jump into and observe.
        </p>
      </div>
      <Suspense fallback={<ObserveMatchesListLoading />}>
        <ObserverMatchesListSuspense {...props} />
      </Suspense>
    </div>
  );
};

const ObserveMatchesListLoading = () => {
  return (
    <div className="flex flex-col gap-6 mx-auto w-full max-w-300">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full rounded-md" />

        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-72 rounded-md" />
        </div>
      </div>

      <div className="w-full mx-auto max-w-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="rounded-xl border bg-card text-card-foreground shadow-xs"
            key={index}
          >
            <div className="w-full h-full flex flex-col items-center gap-2 p-6">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="mt-2 flex w-full min-w-0 flex-col items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex w-full min-w-0 flex-col items-center gap-2">
                  <ParticipantSkeleton />
                  <ParticipantSkeleton />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ParticipantSkeleton = () => {
  return (
    <div className="flex w-full min-w-0 items-center justify-center gap-2">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
};

const ObserverMatchesListSuspense = async ({
  searchParams,
}: ObserveMatchesListParams) => {
  await connection();

  const filters = await loadObservableMatchSearchParams(searchParams);
  const response = await getObservableMatchesAction({
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response)
    return (
      <ErrorState
        title="Fetch error"
        description="Failed to fetch current observable matches. Try refreshing the page or come back another time."
      />
    );

  const { matches, metadata } = response;

  return (
    <div className="flex flex-col gap-6 mx-auto w-full max-w-300">
      <ObservableMatchFilters />
      <ObservableMatchInfiniteCardGrid
        initialMatches={matches}
        hasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default ObserveMatchesListPage;
