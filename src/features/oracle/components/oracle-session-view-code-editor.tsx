"use client";

import { CodeEditor } from "@/components/code/code-editor";
import { EditorProps } from "@monaco-editor/react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { saveUserCodeAction } from "../actions/actions";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CheckIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { useCodeEditorStore } from "@/store/use-code-editor-store";

export const OracleSessionViewCodeEditor = ({
  sessionId,
  problemId,
  serverUserCode,
  ...props
}: {
  sessionId: string;
  problemId: string;
  serverUserCode: string | null;
} & EditorProps) => {
  const saveVersionRef = useRef(0);
  const [userCode, setUserCode] = useState(serverUserCode ?? "");
  const [saveStatus, setSaveStatus] = useState<
    "saving" | "saved" | "error" | null
  >(null);
  const setEditor = useCodeEditorStore((state) => state.setEditor);

  const handleCodeChange = useDebouncedCallback(
    async (value: string | undefined) => {
      if (value === undefined) return;
      const saveVersion = ++saveVersionRef.current;
      setSaveStatus("saving");
      const response = await saveUserCodeAction(sessionId, problemId, value);
      if (saveVersion !== saveVersionRef.current) return;
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
      <CodeEditor
        {...props}
        value={userCode}
        onMount={(editor) => setEditor(editor)}
        onChange={(value) => {
          const nextCode = value ?? "";
          setUserCode(nextCode);
          handleCodeChange(nextCode);
        }}
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
