import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsersAction } from "@/features/social/actions/actions";
import { CommunityFilters } from "@/features/social/components/community-filters";
import { CommunityUserInfiniteCardList } from "@/features/social/components/community-user-infinite-card-list";
import { loadCommunitySearchParams } from "@/features/social/lib/params";
import { getCurrentUser } from "@/lib/auth/helpers";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type CommunityParams = { searchParams: Promise<SearchParams> };

const CommunityPage = (props: CommunityParams) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h1 className="text-3xl font-semibold">Explore Users</h1>
      <Suspense fallback={<CommunityLoading />}>
        <CommunitySuspense {...props} />
      </Suspense>
    </div>
  );
};

const CommunityLoading = () => {
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

const CommunitySuspense = async ({ searchParams }: CommunityParams) => {
  const { userId } = await getCurrentUser();
  // todo: make this page public and handle not signed in users
  if (!userId) return null;

  const filters = await loadCommunitySearchParams(searchParams);

  const response = await getUsersAction(userId, {
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return <div>Failed to fetch users</div>;
  }

  const { users, metadata } = response;

  return (
    <div className="flex flex-col gap-6 w-full">
      {filters.explanation.trim() && (
        <div className="w-full p-4 bg-card rounded-xl border shadow-sm flex flex-col gap-2">
          <span className="tracking-widest font-medium text-sm text-muted-foreground">
            AI REASONING
          </span>
          <p className="text-muted-foreground text-lg">{filters.explanation}</p>
        </div>
      )}
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
