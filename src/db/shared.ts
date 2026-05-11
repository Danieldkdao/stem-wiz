import { pgEnum } from "drizzle-orm/pg-core";

export const programmingLanguages = [
  "python",
  "javascript",
  "java",
  "c++",
  "typescript",
] as const;
export type ProgrammingLanguageType = (typeof programmingLanguages)[number];
export const programmingLanguageEnum = pgEnum(
  "programming_languages",
  programmingLanguages,
);

export const difficultyLevels = ["easy", "medium", "hard"] as const;
export type DifficultyLevelType = (typeof difficultyLevels)[number];
export const difficultyLevelEnum = pgEnum(
  "difficulty_levels",
  difficultyLevels,
);

export const matchStatuses = ["in-progress", "finished"] as const;
export type MatchStatusType = (typeof matchStatuses)[number];
export const matchStatusEnum = pgEnum("match_statuses", matchStatuses);
