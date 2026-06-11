import { Suspense } from "react";
import { CommunityParams } from "../../lib/types";
import { getCurrentUser } from "@/lib/auth/helpers";
import { loadCommunitySearchParams } from "../../lib/params";
import { getUsersAction } from "../../actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { CommunityFilters } from "../community-filters";
import { CommunityUserInfiniteCardList } from "../community-user-infinite-card-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CommunityExploreView = (props: CommunityParams) => {
  return (
    <Suspense fallback={<CommunityExploreViewLoading />}>
      <CommunityExploreViewSuspense {...props} />
    </Suspense>
  );
};

const CommunityExploreViewLoading = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-4 w-full">
        <Skeleton className="h-11 w-full rounded-md" />
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="size-5" />
            </div>
            <div className="h-px w-full bg-border" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-16" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full grid grid-cols-1 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="h-full">
            <CardContent className="flex flex-col gap-4">
              <div className="min-w-0 w-full flex items-start gap-4">
                <div className="flex flex-col min-w-0 w-full items-center gap-4 md:flex-row md:items-start">
                  <Skeleton className="size-20 shrink-0 rounded-full" />
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-2 md:items-start">
                    <Skeleton className="h-9 w-56 max-w-full" />
                    <Skeleton className="h-5 w-72 max-w-full" />
                    <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-28 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-full max-w-2xl" />
                    <Skeleton className="h-5 w-4/5 max-w-xl" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
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
