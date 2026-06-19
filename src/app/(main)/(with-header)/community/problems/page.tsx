import { Button } from "@/components/ui/button";
import { getCommunityProblemsAction } from "@/features/social/actions/actions";
import { CommunityProblemDialog } from "@/features/social/components/community-problem-dialog";
import { CommunityProblemInfiniteCardGrid } from "@/features/social/components/community-problem-infinite-card-grid";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const CommunityProblemsPage = () => {
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
        <CommunityProblemsSuspense />
      </Suspense>
    </div>
  );
};

const CommunityProblemsLoading = () => {
  return <div>loading</div>;
};

const CommunityProblemsSuspense = async () => {
  const communityProblems = await getCommunityProblemsAction();

  return (
    <div className="flex flex-col gap-6">
      <CommunityProblemInfiniteCardGrid initialProblems={communityProblems} />
    </div>
  );
};

export default CommunityProblemsPage;
