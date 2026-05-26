"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { OracleProblemTable, OracleSessionTable } from "@/db/schema";
import { useState } from "react";
import { OracleSessionProblemDetails } from "./oracle-session-problem-details";
import { OracleSessionViewCodeEditor } from "./oracle-session-view-code-editor";
import { OracleSessionViewHeader } from "./oracle-session-view-header";
import { OracleSessionViewOutput } from "./oracle-session-view-output";

export const OracleSessionView = ({
  session,
  problems,
}: {
  session: typeof OracleSessionTable.$inferSelect;
  problems: (typeof OracleProblemTable.$inferSelect)[];
}) => {
  // todo: make sure to handle the all completed case or -1 no index found case
  const lastProblemIndex = problems.findIndex(
    (problem) => problem.status === "in-progress",
  );
  const [currentProblemIndex, setCurrentProblemIndex] =
    useState(lastProblemIndex);
  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <OracleSessionViewHeader
        session={session}
        currentProblem={currentProblem}
        problemCount={problems.length}
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
                defaultValue={
                  currentProblem.userCode ??
                  currentProblem.starterCode ??
                  undefined
                }
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize="30%">
              <OracleSessionViewOutput language={session.programmingLanguage} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize="30%"></ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
