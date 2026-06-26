import { ProgrammingLanguageType, programmingLanguages } from "@/db/shared";
import { getCurrentUser } from "@/lib/auth/helpers";
import { UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

const WANDBOX_API_URL = "https://wandbox.org/api/compile.json";

const WANDBOX_COMPILER_MAP: Record<ProgrammingLanguageType, string> = {
  python: "cpython-3.13.8",
  javascript: "nodejs-20.17.0",
  java: "openjdk-jdk-21+35",
  cpp: "gcc-13.2.0",
  typescript: "typescript-5.6.2",
};

type ExecuteRequestBody = {
  language?: string;
  stdin?: string;
  files?: Array<{
    content?: string;
  }>;
};

type WandboxResponse = {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
};

const isSupportedLanguage = (
  value: string | undefined,
): value is ProgrammingLanguageType => {
  return programmingLanguages.includes(value as ProgrammingLanguageType);
};

const getExitCode = (status: string | undefined) => {
  const exitCode = Number(status);
  return Number.isFinite(exitCode) ? exitCode : 1;
};

const normalizeWandboxResponse = (data: WandboxResponse) => {
  const status = data.status ?? "1";
  const exitCode = getExitCode(status);
  const compileError =
    data.compiler_error || data.compiler_output || data.compiler_message || "";
  const programError = data.program_error || "";
  const programOutput = data.program_output || "";

  return {
    compile: compileError
      ? {
          stdout: data.compiler_output || "",
          stderr: compileError,
          output: compileError,
          code: 1,
          signal: data.signal || null,
          message: data.compiler_message || null,
          status: "RE",
        }
      : undefined,
    run: {
      stdout: programOutput,
      stderr: programError,
      output: programOutput || programError,
      code: exitCode,
      signal: data.signal || null,
      message: data.program_message || null,
      status: exitCode === 0 ? null : "RE",
    },
  };
};

export const POST = async (req: NextRequest) => {
  const { userId } = await getCurrentUser();
  if (!userId)
    return NextResponse.json(
      { message: UNAUTHED_ERROR_MESSAGE },
      { status: 401 },
    );
  try {
    const body = (await req.json()) as ExecuteRequestBody;
    const language = body.language;
    const code = body.files?.[0]?.content ?? "";

    if (!isSupportedLanguage(language)) {
      return NextResponse.json(
        { message: `${language || "unknown"} runtime is unsupported` },
        { status: 400 },
      );
    }

    if (!code.trim()) {
      return NextResponse.json(
        { message: "No source code was provided" },
        { status: 400 },
      );
    }

    const response = await fetch(WANDBOX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compiler: WANDBOX_COMPILER_MAP[language],
        code,
        stdin: body.stdin ?? "",
        options: "",
        "compiler-option-raw": "",
        "runtime-option-raw": "",
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: `Wandbox request failed with status ${response.status}` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as WandboxResponse;
    return NextResponse.json(normalizeWandboxResponse(data));
  } catch (error) {
    console.error("Error running code with Wandbox:", error);
    return NextResponse.json(
      { message: "Error running code" },
      { status: 500 },
    );
  }
};
