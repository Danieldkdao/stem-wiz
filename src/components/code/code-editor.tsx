"use client";

import { ProgrammingLanguageType } from "@/db/shared";
import { CODE_EDITOR_THEME } from "@/lib/constants";
import { useCodeEditorStore } from "@/store/use-code-editor-store";
import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { MatchSubmissionTable } from "@/db/schema";

type CodeEditorProps = {
  language: ProgrammingLanguageType;
  existingSubmission?:
    | typeof MatchSubmissionTable.$inferSelect
    | null
    | undefined;
};

export const CodeEditor = ({
  language,
  existingSubmission,
}: CodeEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const setEditor = useCodeEditorStore((state) => state.setEditor);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <Skeleton className="w-full h-full" />;

  return (
    <Editor
      defaultValue={existingSubmission?.code}
      language={language}
      onMount={(editor) => setEditor(editor)}
      beforeMount={(monaco) => {
        return monaco.editor.defineTheme(CODE_EDITOR_THEME.id, {
          base: CODE_EDITOR_THEME.base,
          inherit: CODE_EDITOR_THEME.inherit,
          rules: CODE_EDITOR_THEME.rules.map((rule) => ({
            ...rule,
            foreground: rule.foreground,
          })),
          colors: CODE_EDITOR_THEME.colors,
        });
      }}
      theme={CODE_EDITOR_THEME.id}
      options={{
        theme: CODE_EDITOR_THEME.id,
        minimap: { enabled: false },
        fontSize: 16,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        renderWhitespace: "selection",
        fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
        fontLigatures: true,
        cursorBlinking: "smooth",
        smoothScrolling: true,
        contextmenu: true,
        renderLineHighlight: "all",
        lineHeight: 1.6,
        letterSpacing: 0.5,
        roundedSelection: true,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
    />
  );
};
