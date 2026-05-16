import { ProgrammingLanguageType } from "@/db/shared";
import { OnMount } from "@monaco-editor/react";
import { create } from "zustand";

type MonacoEditorType = Parameters<OnMount>[0];

type ExecutionResult = {
  code: string;
  output: string;
  error: string | null;
};

type RunCodeReturnType =
  | {
      output?: string | null;
      error?: string | null;
      executionResult: ExecutionResult;
    }
  | null
  | undefined;

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
  ) => Promise<RunCodeReturnType>;
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
      set({ editor });
    },
    async runCode(language, version): Promise<RunCodeReturnType> {
      const code = get().editor?.getValue() ?? "";
      if (!code.length) return null;

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
          const result = {
            error: data.message,
            executionResult: { code, output: "", error: data.message },
          };
          set(result);
          return result;
        }

        if (data.compile && data.compile.code !== 0) {
          const error = data.compile.stderr || data.compile.output;
          const result = {
            error,
            executionResult: {
              code,
              output: "",
              error,
            },
          };
          set(result);
          return result;
        }

        if (data.run && data.run.code !== 0) {
          const error = data.run.stderr || data.run.output;
          const result = {
            error,
            executionResult: {
              code,
              output: "",
              error,
            },
          };
          set(result);
          return result;
        }
        const output = data.run.output;
        const goodResult = {
          output: output.trim(),
          error: null,
          executionResult: {
            code,
            output: output.trim(),
            error: null,
          },
        };

        set(goodResult);
        return goodResult;
      } catch (error) {
        console.log("Error running code:", error);
        const errorResult = {
          error: "Error running code",
          executionResult: { code, output: "", error: "Error running code" },
        };
        set(errorResult);
      } finally {
        set({ isRunning: false });
      }
    },
  };
});
