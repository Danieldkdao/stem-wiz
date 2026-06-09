import { Suspense } from "react";
import { CommunityParams } from "../lib/types";
import { getCurrentUser } from "@/lib/auth/helpers";
import { loadCommunitySearchParams } from "../lib/params";
import { getUsersAction } from "../actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { CommunityFilters } from "./community-filters";
import { CommunityUserInfiniteCardList } from "./community-user-infinite-card-list";

export const CommunityExploreView = (props: CommunityParams) => {
  return (
    <Suspense fallback={<CommunityExploreViewLoading />}>
      <CommunityExploreViewSuspense {...props} />
    </Suspense>
  );
};

const CommunityExploreViewLoading = () => {
  return <div>loading</div>;
};

const CommunityExploreViewSuspense = async ({
  searchParams,
}: CommunityParams) => {
  const { userId } = await getCurrentUser();
  // todo: make this page public and handle not signed in users
  if (!userId) return null;

  const filters = await loadCommunitySearchParams(searchParams);

  const { users, metadata } = await getUsersAction(userId, {
    ...filters,
    page: DEFAULT_PAGE,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <CommunityFilters />
      <CommunityUserInfiniteCardList
        userId={userId}
        initialUsers={users}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};
