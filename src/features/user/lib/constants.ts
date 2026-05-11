import { ProgrammingLanguageType } from "@/db/shared";

export const LANGUAGE_VERSION_MAP: Record<ProgrammingLanguageType, string> = {
  python: "3.10.0",
  java: "15.0.2",
  javascript: "20.11.1",
  cpp: "10.2.0",
  typescript: "5.0.3",
} as const;
