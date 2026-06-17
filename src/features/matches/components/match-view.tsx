"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  ArenaProblemTable,
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
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
    arenaProblem: typeof ArenaProblemTable.$inferSelect;
  };
  currentUserId: string;
}) => {
  const isMobile = useIsMobile();
  const currentUserSubmission = match.submissions.find(
    (submission) => submission.userId === currentUserId,
  );

  return (
    <ResizablePanelGroup orientation={isMobile ? "vertical" : "horizontal"}>
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
  );
};
