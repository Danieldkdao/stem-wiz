import { ProgrammingLanguageType } from "@/db/shared";
import { OnMount } from "@monaco-editor/react";
import { create } from "zustand";

type MonacoEditorType = Parameters<OnMount>[0];

type ExecutionResult = {
  code: string;
  output: string;
  error: string | null;
};

type CodeEditorStoreType = {
  output: string;
  isRunning: boolean;
  error: string | null;
  editor: MonacoEditorType | null;
  executionResult: ExecutionResult | null;
  setEditor: (editor: MonacoEditorType) => void;
  getCode: () => string;
  runCode: (
    language: ProgrammingLanguageType,
    version: string,
  ) => Promise<void>;
};

export const useCodeEditorStore = create<CodeEditorStoreType>((set, get) => {
  return {
    output: "",
    isRunning: false,
    error: null,
    editor: null,
    executionResult: null,
    getCode: () => get().editor?.getValue() || "",
    setEditor: (editor: MonacoEditorType) => {
      // todo: maybe implement code saving
      set({ editor });
    },
    async runCode(language, version) {
      const code = get().editor?.getValue() ?? "";
      if (!code.length) return;

      try {
        set({ isRunning: true, error: null, output: "" });

        const response = await fetch("/api/code/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language,
            version,
            files: [{ content: code }],
          }),
        });

        const data = await response.json();

        if (data.message) {
          set({
            error: data.message,
            executionResult: { code, output: "", error: data.message },
          });
          return;
        }

        if (data.compile && data.compile.code !== 0) {
          const error = data.compile.stderr || data.compile.output;
          set({
            error,
            executionResult: {
              code,
              output: "",
              error,
            },
          });
          return;
        }

        if (data.run && data.run.code !== 0) {
          const error = data.run.stderr || data.run.output;
          set({
            error,
            executionResult: {
              code,
              output: "",
              error,
            },
          });
          return;
        }
        const output = data.run.output;

        set({
          output: output.trim(),
          error: null,
          executionResult: {
            code,
            output: output.trim(),
            error: null,
          },
        });
      } catch (error) {
        console.log("Error running code:", error);
        set({
          error: "Error running code",
          executionResult: { code, output: "", error: "Error running code" },
        });
      } finally {
        set({ isRunning: false });
      }
    },
  };
});
