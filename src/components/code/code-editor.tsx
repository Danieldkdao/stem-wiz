"use client";

import { CODE_EDITOR_THEME } from "@/lib/constants";
import { Editor } from "@monaco-editor/react";
import { ComponentProps, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";

export const CodeEditor = ({
  language,
  defaultValue,
  height,
  options,
  ...props
}: ComponentProps<typeof Editor>) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <Skeleton className="w-full h-full" />;

  return (
    <Editor
      defaultValue={defaultValue}
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
      theme={CODE_EDITOR_THEME.id}
      height={height}
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
        ...options,
      }}
      {...props}
    />
  );
};
