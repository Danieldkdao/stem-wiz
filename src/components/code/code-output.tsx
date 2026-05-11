"use client";

import { ProgrammingLanguageType } from "@/db/shared";
import { LANGUAGE_VERSION_MAP } from "@/features/user/lib/constants";
import { useCodeEditorStore } from "@/store/use-code-editor-store";
import { PlayIcon } from "lucide-react";
import { Button } from "../ui/button";
import { LoadingSwap } from "../ui/loading-swap";

export const CodeOutput = ({
  language,
}: {
  language: ProgrammingLanguageType;
}) => {
  const runCode = useCodeEditorStore((state) => state.runCode);
  const isRunning = useCodeEditorStore((state) => state.isRunning);
  const output = useCodeEditorStore((state) => state.output);
  const error = useCodeEditorStore((state) => state.error);

  const handleCodeExecution = async () => {
    await runCode(language, LANGUAGE_VERSION_MAP[language]);
  };

  return (
    <div className="flex flex-col bg-card/75 h-full">
      <div className="px-5 py-4 bg-card border-b flex items-center justify-between gap-2 flex-wrap">
        <span className="text-base font-medium text-muted-foreground">
          Output
        </span>
        <Button onClick={handleCodeExecution} disabled={isRunning}>
          <LoadingSwap isLoading={isRunning}>
            <div className="flex items-center gap-2">
              <PlayIcon />
              Run Code
            </div>
          </LoadingSwap>
        </Button>
      </div>
      <div className="p-5 font-mono overflow-y-auto flex-1">
        {error ? (
          <div className="flex flex-col gap-1">
            <span className="text-destructive">Error Running Code</span>
            <pre className="text-destructive">{error}</pre>
          </div>
        ) : (
          <pre>{output}</pre>
        )}
      </div>
    </div>
  );
};
