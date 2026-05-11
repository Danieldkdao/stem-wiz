import { ProgrammingLanguageType } from "@/db/shared";

export const formatPreferredLanguage = (lang: ProgrammingLanguageType) => {
  switch (lang) {
    case "python":
      return "Python";
    case "javascript":
      return "JavaScript";
    case "java":
      return "Java";
    case "c++":
      return "C++";
    case "typescript":
      return "TypeScript";
    default:
      throw new Error(`Unknown language: ${lang satisfies never}`);
  }
};
