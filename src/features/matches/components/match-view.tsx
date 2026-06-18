"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  ArenaProblemConfigTable,
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
  ProblemTable,
  UserMatchTable,
} from "@/db/schema";
import { ArenaProblemDetails } from "@/features/arena-problems/components/arena-problem-details";
import { MatchCodeEditor } from "./match-code-editor";
import { MatchCodeOutput } from "./match-code-output";
import { useIsMobile } from "@/hooks/use-mobile";

export const MatchView = ({
  match,
  currentUserId,
}: {
  match: typeof MatchTable.$inferSelect & {
    result?: typeof MatchResultTable.$inferSelect | null;
    submissions: (typeof MatchSubmissionTable.$inferSelect)[];
    users: (typeof UserMatchTable.$inferSelect)[];
    arenaProblem: typeof ArenaProblemConfigTable.$inferSelect & {
      problem: typeof ProblemTable.$inferSelect;
    };
  };
  currentUserId: string;
}) => {
  const isMobile = useIsMobile();
  const currentUser = match.users.find((user) => user.userId === currentUserId);
  const currentUserSubmission = match.submissions.find(
    (submission) => submission.userId === currentUserId,
  );
  const problem = match.arenaProblem.problem;

  return (
    <ResizablePanelGroup orientation={isMobile ? "vertical" : "horizontal"}>
      <ResizablePanel minSize="30%" className="p-4 sm:p-6 bg-card/75">
        <ArenaProblemDetails problem={problem} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize="40%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="30%">
            <div className="w-full h-full">
              <MatchCodeEditor
                matchId={match.id}
                language={problem.programmingLanguage}
                existingCode={currentUser?.code ?? currentUserSubmission?.code}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize="30%">
            <div className="w-full h-full">
              <MatchCodeOutput
                language={problem.programmingLanguage}
                matchId={match.id}
                existingSubmission={currentUserSubmission}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
