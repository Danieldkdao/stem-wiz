import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { checkExistingMatch } from "@/features/matches/actions/actions";
import { ParamsId } from "@/lib/types";
import { Suspense } from "react";

type MatchCompeteParams = ParamsId<"matchId">;

const MatchCompetePage = (props: MatchCompeteParams) => {
  return (
    <Suspense fallback={<MatchCompeteLoading />}>
      <MatchCompeteSuspense {...props} />
    </Suspense>
  );
};

const MatchCompeteLoading = () => {
  return <div>loading</div>;
};

const MatchCompeteSuspense = async ({ params }: MatchCompeteParams) => {
  const { matchId } = await params;
  const match = await checkExistingMatch(matchId);

  if (!match) {
    return (
      <div>
        match not found reusable component in matches feature folder components
        subfolder
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel>
          <div className="w-full h-full bg-card/50">One</div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel>
              <div className="w-full h-full bg-card/50">One</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <div className="w-full h-full bg-card/50">One</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default MatchCompetePage;
