import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCommunityProblemsAction } from "@/features/social/actions/actions";
import { CommunityProblemDialog } from "@/features/social/components/community-problem-dialog";
import { CommunityProblemFilters } from "@/features/social/components/community-problem-filters";
import { CommunityProblemInfiniteCardGrid } from "@/features/social/components/community-problem-infinite-card-grid";
import { loadCommunityProblemSearchParams } from "@/features/social/lib/community-problem-params";
import { getCurrentUser } from "@/lib/auth/helpers";
import { DEFAULT_PAGE } from "@/lib/constants";
import { PlusIcon } from "lucide-react";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type CommunityProblemsParams = { searchParams: Promise<SearchParams> };

const CommunityProblemsPage = (props: CommunityProblemsParams) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <h1 className="text-3xl font-semibold">Community Problems</h1>
        <CommunityProblemDialog>
          <Button>
            <PlusIcon />
            Create
          </Button>
        </CommunityProblemDialog>
      </div>
      <Suspense fallback={<CommunityProblemsLoading />}>
        <CommunityProblemsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const CommunityProblemsLoading = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-md" />
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <CommunityProblemCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

const CommunityProblemCardSkeleton = () => {
  return (
    <Card className="h-full w-full min-w-0">
      <CardContent className="flex flex-col gap-4 min-w-0">
        <Skeleton className="h-8 w-4/5" />
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-2 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-9/12" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-6 w-20 rounded-sm" />
          <Skeleton className="h-6 w-24 rounded-sm" />
          <Skeleton className="h-6 w-16 rounded-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

const CommunityProblemsSuspense = async ({
  searchParams,
}: CommunityProblemsParams) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const filters = await loadCommunityProblemSearchParams(searchParams);
  const { communityProblems, metadata } = await getCommunityProblemsAction(
    userId,
    {
      ...filters,
      page: DEFAULT_PAGE,
    },
  );

  return (
    <div className="flex flex-col gap-6">
      <CommunityProblemFilters />
      <CommunityProblemInfiniteCardGrid
        initialProblems={communityProblems}
        initialHasNextPage={metadata.hasNextPage}
        userId={userId}
      />
    </div>
  );
};

export default CommunityProblemsPage;
