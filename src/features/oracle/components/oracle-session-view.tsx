"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ChatMessageTable,
  ChatTable,
  OracleProblemTable,
  OracleSessionTable,
} from "@/db/schema";
import { useEffect, useState } from "react";
import { OracleSessionProblemDetails } from "./oracle-session-problem-details";
import { OracleSessionViewCodeEditor } from "./oracle-session-view-code-editor";
import { OracleSessionViewHeader } from "./oracle-session-view-header";
import { OracleSessionViewOutput } from "./oracle-session-view-output";
import { OraclePanel } from "./oracle-panel";
import { OracleSessionCompleteDialog } from "./oracle-session-complete-dialog";

export const OracleSessionView = ({
  session,
  problems,
}: {
  session: typeof OracleSessionTable.$inferSelect;
  problems: (typeof OracleProblemTable.$inferSelect & {
    chat:
      | (typeof ChatTable.$inferSelect & {
          messages: (typeof ChatMessageTable.$inferSelect)[];
        })
      | null;
  })[];
}) => {
  const lastProblemIndex = problems.findIndex(
    (problem) => problem.status === "in-progress",
  );
  const [currentProblemIndex, setCurrentProblemIndex] = useState(
    lastProblemIndex === -1 ? 0 : lastProblemIndex,
  );
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const currentProblem = problems[currentProblemIndex];

  useEffect(() => {
    if (session.status === "completed" && session.completedAt) {
      setCompletionDialogOpen(true);
    }
  }, [session]);

  return (
    <>
      <OracleSessionCompleteDialog
        open={completionDialogOpen}
        setOpen={setCompletionDialogOpen}
        sessionId={session.id}
      />
      <div className="flex flex-col w-full h-full overflow-hidden">
        <OracleSessionViewHeader
          session={session}
          problems={problems}
          currentProblemIndex={currentProblemIndex}
          setCurrentProblemIndex={setCurrentProblemIndex}
        />
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 overflow-y-auto"
        >
          <OracleSessionProblemDetails problem={currentProblem} />
          <ResizableHandle />
          <ResizablePanel minSize="30%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel minSize="30%">
                <OracleSessionViewCodeEditor
                  sessionId={session.id}
                  problemId={currentProblem.id}
                  language={session.programmingLanguage}
                  value={
                    currentProblem.userCode ??
                    currentProblem.starterCode ??
                    undefined
                  }
                />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel minSize="30%">
                <OracleSessionViewOutput
                  language={session.programmingLanguage}
                  sessionId={session.id}
                  problem={currentProblem}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />
          <OraclePanel problem={currentProblem} />
        </ResizablePanelGroup>
      </div>
    </>
  );
};
