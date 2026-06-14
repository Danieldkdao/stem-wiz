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
  return <div>loading</div>;
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
    return <div>Failed to fetch user matches</div>;
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
