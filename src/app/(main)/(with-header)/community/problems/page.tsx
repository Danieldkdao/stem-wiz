import { Button } from "@/components/ui/button";
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
  return <div>loading</div>;
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
