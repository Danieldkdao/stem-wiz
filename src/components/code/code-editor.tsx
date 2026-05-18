"use client";

import {
  CODE_EDITOR_DARK_THEME,
  CODE_EDITOR_LIGHT_THEME,
} from "@/lib/constants";
import { Editor } from "@monaco-editor/react";
import { ComponentProps, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useTheme } from "next-themes";

export const CodeEditor = ({
  language,
  defaultValue,
  height,
  options,
  ...props
}: ComponentProps<typeof Editor>) => {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const editorTheme =
    resolvedTheme === "dark" ? CODE_EDITOR_DARK_THEME : CODE_EDITOR_LIGHT_THEME;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <Skeleton className="w-full h-full" />;

  return (
    <Editor
      defaultValue={defaultValue}
      language={language}
      beforeMount={(monaco) => {
        [CODE_EDITOR_DARK_THEME, CODE_EDITOR_LIGHT_THEME].forEach((theme) => {
          monaco.editor.defineTheme(theme.id, {
            base: theme.base,
            inherit: theme.inherit,
            rules: theme.rules.map((rule) => ({
              ...rule,
              foreground: rule.foreground,
            })),
            colors: theme.colors,
          });
        });
      }}
      theme={editorTheme.id}
      height={height}
      options={{
        theme: editorTheme.id,
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
