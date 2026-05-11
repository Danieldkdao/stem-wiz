"use client";

import { ProgrammingLanguageType } from "@/db/shared";
import { CODE_EDITOR_THEME } from "@/lib/constants";
import { Editor } from "@monaco-editor/react";

export const CodeEditor = ({
  language,
}: {
  language: ProgrammingLanguageType;
}) => {
  return (
    <Editor
      language={language}
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
