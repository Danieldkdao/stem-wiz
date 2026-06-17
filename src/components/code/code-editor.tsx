"use client";

import {
  CODE_EDITOR_DARK_THEME,
  CODE_EDITOR_LIGHT_THEME,
} from "@/lib/constants";
import { Editor, OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { ErrorBoundary } from "react-error-boundary";
import { CircleXIcon } from "lucide-react";

export const CodeEditor = ({
  language,
  defaultValue,
  height,
  options,
  onMount,
  ...props
}: ComponentProps<typeof Editor>) => {
  const disposedRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { resolvedTheme } = useTheme();
  const editorTheme =
    resolvedTheme === "dark" ? CODE_EDITOR_DARK_THEME : CODE_EDITOR_LIGHT_THEME;
  const [editorKey, setEditorKey] = useState(0);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    disposedRef.current = false;

    resizeObserverRef.current = new ResizeObserver(() => {
      if (disposedRef.current) return;
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model || model.isDisposed()) return;

        editor.layout();
      });
    });

    if (wrapperRef.current) {
      resizeObserverRef.current.observe(wrapperRef.current);
    }

    onMount?.(editor, monaco);
  };

  useEffect(() => {
    return () => {
      setEditorKey((prev) => prev + 1);
    };
  }, []);

  useEffect(() => {
    return () => {
      disposedRef.current = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      editorRef.current = null;
    };
  }, []);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <ErrorBoundary
        fallback={
          <div className="w-full h-full bg-card rounded-lg border-4 border-dashed border-destructive p-5 flex flex-col gap-2 items-center justify-center">
            <CircleXIcon className="text-destructive size-10" />
            <h2 className="text-2xl font-semibold text-center text-destructive">
              An error occurred
            </h2>
            <p className="text-lg text-center max-w-150 text-destructive">
              Something went wrong. We were unable to load this code editor. Try
              reloading the page or come back later.
            </p>
          </div>
        }
      >
        <Editor
          defaultValue={defaultValue}
          key={editorKey}
          language={language}
          beforeMount={(monaco) => {
            [CODE_EDITOR_DARK_THEME, CODE_EDITOR_LIGHT_THEME].forEach(
              (theme) => {
                monaco.editor.defineTheme(theme.id, {
                  base: theme.base,
                  inherit: theme.inherit,
                  rules: theme.rules.map((rule) => ({
                    ...rule,
                    foreground: rule.foreground,
                  })),
                  colors: theme.colors,
                });
              },
            );
          }}
          onMount={handleMount}
          theme={editorTheme.id}
          height={height}
          loading={<Skeleton className="w-full h-full" />}
          options={{
            theme: editorTheme.id,
            minimap: { enabled: false },
            fontSize: 16,
            automaticLayout: false,
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
      </ErrorBoundary>
    </div>
  );
};
