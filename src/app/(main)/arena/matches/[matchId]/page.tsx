import { CodeEditor } from "@/components/code/code-editor";
import { CodeOutput } from "@/components/code/code-output";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { checkExistingMatch } from "@/features/matches/actions/actions";
import { MatchHeader } from "@/features/matches/components/match-header";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";
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
  return <div>loading</div>;
};

const MatchCompeteSuspense = async ({ params }: MatchCompeteParams) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { matchId } = await params;
  const match = await checkExistingMatch({ id: matchId });

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
          <div className="w-full h-full overflow-y-auto flex flex-col gap-4">
            <h1 className="text-3xl font-semibold">
              {match.arenaProblem.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge>
                {formatProgrammingLanguage(
                  match.arenaProblem.programmingLanguage,
                )}
              </Badge>
              <Badge>
                {formatDifficultyLevel(match.arenaProblem.difficultyLevel)}
              </Badge>
            </div>
            <Separator />
            <MarkdownRenderer>
              {match.arenaProblem.description}
            </MarkdownRenderer>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize="40%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel minSize="30%">
              <div className="w-full h-full">
                <CodeEditor
                  language={match.arenaProblem.programmingLanguage}
                  existingSubmission={currentUserSubmission}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize="30%">
              <div className="w-full h-full">
                <CodeOutput
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
