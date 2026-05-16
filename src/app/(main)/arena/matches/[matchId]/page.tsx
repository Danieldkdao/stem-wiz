import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { ArenaProblemDetails } from "@/features/arena-problems/components/arena-problem-details";
import { checkExistingMatchAction } from "@/features/matches/actions/actions";
import { MatchCodeEditor } from "@/features/matches/components/match-code-editor";
import { MatchCodeOutput } from "@/features/matches/components/match-code-output";
import { MatchHeader } from "@/features/matches/components/match-header";
import { auth } from "@/lib/auth/auth";
import { ParamsId } from "@/lib/types";
import { headers } from "next/headers";
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
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full py-4 grid grid-cols-3 border-b bg-background/50 px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1">
        <div className="w-[34%] min-w-80 border-r bg-card/75 p-4 sm:p-6">
          <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
            <Skeleton className="h-9 w-3/4" />
            <div className="mb-2 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="h-px w-full bg-border" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-8/12" />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 border-b bg-background">
            <div className="flex h-full flex-col">
              <div className="flex h-10 items-center gap-2 border-b px-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-9/12" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-8/12" />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-card/60">
            <div className="flex h-full flex-col">
              <div className="flex h-12 items-center justify-between border-b px-4">
                <Skeleton className="h-5 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-7/12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchCompeteSuspense = async ({ params }: MatchCompeteParams) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { matchId } = await params;
  const match = await checkExistingMatchAction({ id: matchId });

  if (!match) {
    return (
      <div>
        match not found reusable component in matches feature folder components
        subfolder
      </div>
    );
  }

  const currentUserSubmission = match.submissions.find(
    (submission) => submission.userId === session.user.id,
  );

  return (
    <div className="w-full h-full flex flex-col items-center">
      <MatchHeader match={match} />
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel minSize="30%" className="p-4 sm:p-6 bg-card/75">
          <ArenaProblemDetails arenaProblem={match.arenaProblem} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize="40%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel minSize="30%">
              <div className="w-full h-full">
                <MatchCodeEditor
                  matchId={match.id}
                  language={match.arenaProblem.programmingLanguage}
                  existingSubmission={currentUserSubmission}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize="30%">
              <div className="w-full h-full">
                <MatchCodeOutput
                  language={match.arenaProblem.programmingLanguage}
                  matchId={match.id}
                  existingSubmission={currentUserSubmission}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default MatchCompetePage;
