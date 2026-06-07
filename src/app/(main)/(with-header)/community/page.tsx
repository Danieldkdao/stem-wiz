import { getUsersAction } from "@/features/user/actions/actions";
import { CommunityFilters } from "@/features/user/components/community-filters";
import { CommunityUserInfiniteCardList } from "@/features/user/components/community-user-infinite-card-list";
import { loadCommunitySearchParams } from "@/features/user/lib/params";
import { getCurrentUser } from "@/lib/auth/helpers";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type CommunityParams = { searchParams: Promise<SearchParams> };

const CommunityPage = (props: CommunityParams) => {
  return (
    <div className="flex flex-col items-center gap-8 h-full overflow-y-auto w-full pb-20 pt-20 px-10">
      <h1 className="text-4xl md:text-6xl font-bold text-center">
        Explore our community of developers
      </h1>
      <Suspense fallback={<CommunityLoading />}>
        <CommunitySuspense {...props} />
      </Suspense>
    </div>
  );
};

const CommunityLoading = () => {
  return <div>loading state</div>;
};

const CommunitySuspense = async ({ searchParams }: CommunityParams) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const filters = await loadCommunitySearchParams(searchParams);

  const { users, metadata } = await getUsersAction(userId, {
    ...filters,
    page: DEFAULT_PAGE,
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-250">
      <CommunityFilters />
      <CommunityUserInfiniteCardList
        userId={userId}
        initialUsers={users}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default CommunityPage;
