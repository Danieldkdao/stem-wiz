import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { difficultyLevelEnum, programmingLanguageEnum } from "../shared";
import { relations } from "drizzle-orm";
import { MatchTable } from "./match";

export const ArenaProblemTable = pgTable("arena_problems", {
  id,
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  difficultyLevel: difficultyLevelEnum("difficulty_level").notNull(),
  timeLimit: integer("time_limit").notNull(),
  programmingLanguage: programmingLanguageEnum(
    "programming_language",
  ).notNull(),
  solution: text("solution").notNull(),
  createdAt,
  updatedAt,
});

export const arenaProblemRelations = relations(
  ArenaProblemTable,
  ({ many }) => ({
    matches: many(MatchTable),
  }),
);
