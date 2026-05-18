import { ProgrammingLanguageType, UserExperienceLevelType } from "@/db/shared";

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

export const formatExperienceLevel = (level: UserExperienceLevelType) => {
  switch (level) {
    case "beginner":
      return "Beginner";
    case "junior":
      return "Junior";
    case "senior":
      return "Senior";
    default:
      throw new Error(`Unknown experience level: ${level satisfies never}`);
  }
};
