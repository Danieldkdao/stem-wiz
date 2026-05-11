import { DifficultyLevelType } from "@/db/shared";

export const formatDifficultyLevel = (level: DifficultyLevelType) => {
  switch (level) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    default:
      throw new Error(`Unknown difficulty level: ${level satisfies never}`);
  }
};
