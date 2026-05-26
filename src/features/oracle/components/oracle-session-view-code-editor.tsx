"use client";

import { CodeEditor } from "@/components/code/code-editor";
import { EditorProps } from "@monaco-editor/react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { saveUserCode } from "../actions/actions";
import { useState } from "react";
import { toast } from "sonner";
import { CheckIcon, RefreshCwIcon, XIcon } from "lucide-react";

export const OracleSessionViewCodeEditor = ({
  sessionId,
  problemId,
  ...props
}: { sessionId: string; problemId: string } & EditorProps) => {
  const [saveStatus, setSaveStatus] = useState<
    "saving" | "saved" | "error" | null
  >(null);
  const handleCodeChange = useDebouncedCallback(
    async (value: string | undefined) => {
      if (!value) return;
      setSaveStatus("saving");
      const response = await saveUserCode(sessionId, problemId, value);
      if (response.error) {
        toast.error(response.message);
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
        setTimeout(() => {
          setSaveStatus(null);
        }, 2000);
      }
    },
    { wait: 300 },
  );

  return (
    <div className="w-full h-full relative">
      <CodeEditor {...props} onChange={handleCodeChange} />
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
