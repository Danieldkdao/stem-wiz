"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { ProgrammingLanguageType } from "@/db/shared";
import { LANGUAGE_VERSION_MAP } from "@/features/user/lib/constants";
import { useConfirm } from "@/hooks/use-confirm";
import { useCodeEditorStore } from "@/store/use-code-editor-store";
import { PlayIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { handleUserProblemSubmissionAction } from "../actions/actions";
import { useOracleStore } from "@/store/use-oracle-store";
import { OracleProblemTable } from "@/db/schema";

export const OracleSessionViewOutput = ({
  language,
  sessionId,
  problem,
}: {
  language: ProgrammingLanguageType;
  sessionId: string;
  problem: typeof OracleProblemTable.$inferSelect;
}) => {
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Submission",
    "Are you sure you want to submit your solution? This action is permanent and cannot be undone.",
  );
  const router = useRouter();
  const runCode = useCodeEditorStore((state) => state.runCode);
  const isRunning = useCodeEditorStore((state) => state.isRunning);
  const output = useCodeEditorStore((state) => state.output);
  const error = useCodeEditorStore((state) => state.error);
  const getCode = useCodeEditorStore((state) => state.getCode);

  const setFeedbackGenerationStatus = useOracleStore(
    (state) => state.setFeedbackGenerationStatus,
  );
  const setTabValue = useOracleStore((state) => state.setTabValue);

  const isCompleted = problem.status === "completed" || !!problem.completedAt;

  const handleCodeExecution = async () => {
    await runCode(language, LANGUAGE_VERSION_MAP[language]);
  };

  const handleSolutionSubmission = async () => {
    if (isCompleted)
      return toast.error("You have already submitted your solution.");
    const confirmation = await confirm();
    if (!confirmation) return;
    if (isPending) return;
    const code = getCode();
    if (!code.trim())
      return toast.error("You cannot submit an empty solution.");

    setFeedbackGenerationStatus("generating");
    setTabValue("feedback");

    startTransition(async () => {
      const response = await handleUserProblemSubmissionAction(
        sessionId,
        problem.id,
      );
      if (response.error) {
        toast.error(response.message);
        setFeedbackGenerationStatus("error");
      } else {
        toast.success(response.message);
        setFeedbackGenerationStatus("success");
        router.refresh();
      }
    });
  };

  const buttonsDisabled = isRunning || isPending;

  return (
    <>
      {ConfirmationDialog}
      <div className="flex flex-col bg-card/75 h-full">
        <div className="px-5 py-4 bg-card border-b flex items-center justify-between gap-2 flex-wrap">
          <span className="text-base font-medium text-muted-foreground">
            Output
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCodeExecution}
              disabled={buttonsDisabled}
              variant="outline"
            >
              <LoadingSwap isLoading={isRunning}>
                <div className="flex items-center gap-2">
                  <PlayIcon />
                  Run Code
                </div>
              </LoadingSwap>
            </Button>
            <Button
              disabled={buttonsDisabled || isCompleted}
              onClick={handleSolutionSubmission}
            >
              <LoadingSwap isLoading={isPending}>
                <div className="flex items-center gap-2">
                  <>
                    <SendIcon />
                    Submit Solution
                  </>
                </div>
              </LoadingSwap>
            </Button>
          </div>
        </div>
        <div className="p-5 font-mono overflow-y-auto flex-1">
          {error ? (
            <div className="flex flex-col gap-1">
              <span className="text-destructive">Error Running Code</span>
              <pre className="text-destructive text-wrap">{error}</pre>
            </div>
          ) : (
            <pre className="text-wrap">{output}</pre>
          )}
        </div>
      </div>
    </>
  );
};
