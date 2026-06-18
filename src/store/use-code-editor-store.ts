import { ProgrammingLanguageType } from "@/db/shared";
import { create } from "zustand";

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
  code: string;
  setCode: (value: string) => void;
  output: string;
  isRunning: boolean;
  error: string | null;
  executionResult: ExecutionResult | null;
  getCode: () => string;
  runCode: (
    language: ProgrammingLanguageType,
    version: string,
  ) => Promise<RunCodeReturnType>;
};

export const useCodeEditorStore = create<CodeEditorStoreType>((set, get) => {
  return {
    code: "",
    setCode: (value) => set({ code: value }),
    output: "",
    isRunning: false,
    error: null,
    executionResult: null,
    getCode: () => get().code,
    async runCode(language, version): Promise<RunCodeReturnType> {
      const code = get().code;
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
