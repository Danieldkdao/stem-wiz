import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserMatchesAction } from "@/features/matches/actions/actions";
import { UserMatchFilters } from "@/features/matches/components/user-match-filters";
import { UserMatchInfiniteCardList } from "@/features/matches/components/user-match-infinite-card-list";
import { loadUserMatchSearchParams } from "@/features/matches/lib/params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type UserMatchesSearchParams = {
  searchParams: Promise<SearchParams>;
};

const UserMatchesPage = (props: UserMatchesSearchParams) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto py-10 px-6 h-full">
      <h1 className="text-3xl font-semibold">My Matches</h1>
      <Suspense fallback={<UserMatchesLoading />}>
        <UserMatchesSuspense {...props} />
      </Suspense>
    </div>
  );
};

const UserMatchesLoading = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-4 w-full">
        <Skeleton className="h-12 w-full rounded-md" />

        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-56 rounded-md" />
          <Skeleton className="h-9 w-64 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {Array.from({ length: 6 }).map((_, index) => (
          <UserMatchCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

const UserMatchCardSkeleton = () => {
  return (
    <Card className="h-full w-full min-w-0">
      <CardContent className="flex flex-col gap-4 w-full min-w-0 h-full min-h-0">
        <div className="flex items-start w-full min-w-0 gap-2">
          <div className="flex items-center gap-4 w-full min-w-0 flex-1">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2 flex-1 min-w-0 w-full">
              <Skeleton className="h-8 w-40 max-w-full" />
              <Skeleton className="h-6 w-56 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <Skeleton className="h-16 w-full rounded-lg" />

        <Skeleton className="h-px w-full" />

        <div className="flex flex-col gap-4 w-full">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-between w-full"
            >
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>

        <Skeleton className="h-px w-full" />
        <Skeleton className="h-9 w-full mt-auto" />
      </CardContent>
    </Card>
  );
};

const UserMatchesSuspense = async ({
  searchParams,
}: UserMatchesSearchParams) => {
  const filters = await loadUserMatchSearchParams(searchParams);

  const response = await getUserMatchesAction({
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <div className="py-10 px-6 w-full h-full">
        <ErrorState
          title="An error occurred"
          description="We were unable to load your match history. Try refreshing the page or come back later if the issue persists."
        />
      </div>
    );
  }

  const { matches, metadata } = response;

  return (
    <div className="flex flex-col gap-6 w-full">
      <UserMatchFilters />
      <UserMatchInfiniteCardList
        initialMatches={matches}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default UserMatchesPage;
