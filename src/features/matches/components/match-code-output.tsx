"use client";

import { ProgrammingLanguageType } from "@/db/shared";
import { LANGUAGE_VERSION_MAP } from "@/features/user/lib/constants";
import { useCodeEditorStore } from "@/store/use-code-editor-store";
import { CheckCircleIcon, PlayIcon, SendIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { LoadingSwap } from "../../../components/ui/loading-swap";
import { useMatchStore } from "@/store/use-match-store";
import { useTransition } from "react";
import { codeSubmissionAction } from "@/features/matches/actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MatchSubmissionTable } from "@/db/schema";
import { useMatchSocket } from "@/features/matches/hooks/use-match-socket";

type CodeOutputProps = {
  language: ProgrammingLanguageType;
  matchId: string;
  existingSubmission?:
    | typeof MatchSubmissionTable.$inferSelect
    | null
    | undefined;
};

export const MatchCodeOutput = ({
  language,
  matchId,
  existingSubmission,
}: CodeOutputProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    status,
    broadcastCodeSubmission,
    broadcastCodeOutput,
    broadcastRunningCode,
  } = useMatchSocket();

  const runCode = useCodeEditorStore((state) => state.runCode);
  const isRunning = useCodeEditorStore((state) => state.isRunning);
  const output = useCodeEditorStore((state) => state.output);
  const error = useCodeEditorStore((state) => state.error);
  const getCode = useCodeEditorStore((state) => state.getCode);

  const isEnding = useMatchStore((state) => state.isEnding);

  const handleCodeExecution = async () => {
    broadcastRunningCode(matchId);
    const result = await runCode(language, LANGUAGE_VERSION_MAP[language]);
    if (status === "open" && result) {
      broadcastCodeOutput({
        matchId,
        output: result.output,
        error: result.error,
      });
    }
  };

  const handleCodeSubmission = async () => {
    if (isPending) return;
    const code = getCode();
    if (!code.trim())
      return toast.error("Please enter some code before submitting.");

    startTransition(async () => {
      const response = await codeSubmissionAction(matchId, code);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        broadcastCodeSubmission(matchId);
        router.refresh();
      }
    });
  };

  const buttonsDisabled = isRunning || isEnding || isPending;

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
          <Button disabled={buttonsDisabled} onClick={handleCodeSubmission}>
            <LoadingSwap isLoading={isPending}>
              <div className="flex items-center gap-2">
                {existingSubmission ? (
                  <>
                    <CheckCircleIcon />
                    Resubmit Code
                  </>
                ) : (
                  <>
                    <SendIcon />
                    Submit Code
                  </>
                )}
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
