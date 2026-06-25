"use client";

import { CodeEditor } from "@/components/code/code-editor";
import { ProgrammingLanguageType } from "@/db/shared";
import { useCodeEditorStore } from "@/store/use-code-editor-store";
import { useDebouncer } from "@tanstack/react-pacer";
import { CheckIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { saveUserMatchCode } from "../actions/actions";
import { useMatchSocket } from "../hooks/use-match-socket";

type MatchCodeEditorProps = {
  matchId: string;
  language: ProgrammingLanguageType;
  existingCode: string | null | undefined;
};

export const MatchCodeEditor = ({
  matchId,
  language,
  existingCode,
}: MatchCodeEditorProps) => {
  const saveVersionRef = useRef(0);
  const { status, broadcastCodeSnapshot } = useMatchSocket();
  const [userCode, setUserCode] = useState(existingCode ?? "");
  const [saveStatus, setSaveStatus] = useState<
    "saving" | "saved" | "error" | null
  >(null);
  const setCode = useCodeEditorStore((state) => state.setCode);
  const handleCodeChange = useDebouncer(
    async (code: string | undefined) => {
      if (status !== "open" || code === undefined) {
        return;
      }

      const saveVersion = ++saveVersionRef.current;
      setSaveStatus("saving");
      broadcastCodeSnapshot({ matchId, code });

      const response = await saveUserMatchCode(matchId, code);
      if (saveVersion !== saveVersionRef.current) return;
      if (response.error) {
        setSaveStatus("error");
        toast.error(response.message);
      } else {
        setSaveStatus("saved");
        setTimeout(() => {
          setSaveStatus(null);
        }, 2000);
      }
    },
    { wait: 250 },
  );

  useEffect(() => {
    return () => {
      handleCodeChange.cancel();
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <CodeEditor
        language={language}
        path={`match:${matchId}:self`}
        key={matchId}
        value={userCode}
        onChange={(value) => {
          const code = value ?? "";
          setCode(code);
          setUserCode(code);
          handleCodeChange.maybeExecute(code);
        }}
        keepCurrentModel
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        {saveStatus ? (
          saveStatus === "saving" ? (
            <>
              <RefreshCwIcon className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Saving...
              </span>
            </>
          ) : saveStatus === "saved" ? (
            <>
              <CheckIcon className="text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">
                Saved!
              </span>
            </>
          ) : (
            <>
              <XIcon className="text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Error
              </span>
            </>
          )
        ) : null}
      </div>
    </div>
  );
};
