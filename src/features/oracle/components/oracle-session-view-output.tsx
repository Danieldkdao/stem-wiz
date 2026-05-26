"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { ProgrammingLanguageType } from "@/db/shared";
import { LANGUAGE_VERSION_MAP } from "@/features/user/lib/constants";
import { useCodeEditorStore } from "@/store/use-code-editor-store";
import { PlayIcon, SendIcon } from "lucide-react";

export const OracleSessionViewOutput = ({
  language,
}: {
  language: ProgrammingLanguageType;
}) => {
  const runCode = useCodeEditorStore((state) => state.runCode);
  const isRunning = useCodeEditorStore((state) => state.isRunning);
  const output = useCodeEditorStore((state) => state.output);
  const error = useCodeEditorStore((state) => state.error);
  const getCode = useCodeEditorStore((state) => state.getCode);

  const handleCodeExecution = async () => {
    await runCode(language, LANGUAGE_VERSION_MAP[language]);
  };

  // const handleCodeSubmission = async () => {
  //   if (isPending) return;
  //   const code = getCode();
  //   if (!code.trim())
  //     return toast.error("Please enter some code before submitting.");

  //   startTransition(async () => {
  //     const response = await codeSubmissionAction(matchId, code);
  //     if (response.error) {
  //       toast.error(response.message);
  //     } else {
  //       toast.success(response.message);
  //       broadcastCodeSubmission(matchId);
  //       router.refresh();
  //     }
  //   });
  // };

  const buttonsDisabled = isRunning;

  return (
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
          <Button disabled={buttonsDisabled}>
            <LoadingSwap isLoading={false}>
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
  );
};
