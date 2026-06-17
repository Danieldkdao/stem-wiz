"use client";

import { CodeEditor } from "@/components/code/code-editor";
import { MatchSubmissionTable } from "@/db/schema";
import { ProgrammingLanguageType } from "@/db/shared";
import { useDebouncer } from "@tanstack/react-pacer";
import { useEffect, useRef } from "react";
import { useMatchSocket } from "../hooks/use-match-socket";
import { useCodeEditorStore } from "@/store/use-code-editor-store";

type MatchCodeEditorProps = {
  matchId: string;
  language: ProgrammingLanguageType;
  existingSubmission?:
    | typeof MatchSubmissionTable.$inferSelect
    | null
    | undefined;
};

export const MatchCodeEditor = ({
  matchId,
  language,
  existingSubmission,
}: MatchCodeEditorProps) => {
  const isMountedRef = useRef(true);
  const { status, broadcastCodeSnapshot } = useMatchSocket();
  const setCode = useCodeEditorStore((state) => state.setCode);
  const handleCodeChange = useDebouncer(
    (code: string | undefined) => {
      if (!isMountedRef.current || status !== "open" || code === undefined)
        return;
      broadcastCodeSnapshot({ matchId, code });
    },
    { wait: 250 },
  );

  useEffect(() => {
    setCode(existingSubmission?.code ?? "");
  }, [matchId, existingSubmission?.code, setCode]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      handleCodeChange.cancel();
    };
  }, []);

  return (
    <CodeEditor
      language={language}
      path={`match:${matchId}:self`}
      key={matchId}
      defaultValue={existingSubmission?.code}
      onChange={(value) => {
        const code = value ?? "";
        setCode(code);
        handleCodeChange.maybeExecute(code);
      }}
      keepCurrentModel
    />
  );
};
