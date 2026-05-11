import { ProgrammingLanguageType } from "@/db/shared";

export const formatProgrammingLanguage = (lang: ProgrammingLanguageType) => {
  switch (lang) {
    case "python":
      return "Python";
    case "javascript":
      return "JavaScript";
    case "java":
      return "Java";
    case "cpp":
      return "C++";
    case "typescript":
      return "TypeScript";
    default:
      throw new Error(`Unknown language: ${lang satisfies never}`);
  }
};
