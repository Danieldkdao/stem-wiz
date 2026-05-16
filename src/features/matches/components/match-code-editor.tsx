"use client";

import { CodeEditor } from "@/components/code/code-editor";
import { MatchSubmissionTable } from "@/db/schema";
import { ProgrammingLanguageType } from "@/db/shared";
import { useCodeEditorStore } from "@/store/use-code-editor-store";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useMatchSocket } from "../hooks/use-match-socket";

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
  const setEditor = useCodeEditorStore((state) => state.setEditor);
  const { status, broadcastCodeSnapshot } = useMatchSocket();
  const handleCodeChange = useDebouncedCallback(
    (code: string | undefined) => {
      if (status !== "open" || code === undefined) return;
      broadcastCodeSnapshot({ matchId, code });
    },
    { wait: 250 },
  );

  return (
    <CodeEditor
      language={language}
      defaultValue={existingSubmission?.code}
      onMount={(editor) => setEditor(editor)}
      onChange={handleCodeChange}
    />
  );
};
