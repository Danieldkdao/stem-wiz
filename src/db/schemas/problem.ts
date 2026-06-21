import { jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import {
  difficultyLevelEnum,
  problemSourceEnum,
  programmingLanguageEnum,
} from "../shared";
import { relations } from "drizzle-orm";
import { ArenaProblemConfigTable } from "./arena-problem-config";
import { OracleSessionProblemTable } from "./oracle-problem";
import { CommunityProblemTable } from "./community-problem";
import { FriendMatchRequestTable } from "./friend-match-request";

export const ProblemTable = pgTable("problems", {
  id,
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  difficultyLevel: difficultyLevelEnum("difficulty_level").notNull(),
  programmingLanguage: programmingLanguageEnum(
    "programming_language",
  ).notNull(),
  starterCode: text("starter_code"),
  solution: text("solution").notNull(),
  concepts: jsonb("concepts").$type<string[]>().notNull().default([]),
  source: problemSourceEnum("source").notNull().default("system"),
  createdAt,
  updatedAt,
});

export const problemRelations = relations(ProblemTable, ({ many }) => ({
  arenaProblems: many(ArenaProblemConfigTable),
  oracleProblems: many(OracleSessionProblemTable),
  communityProblems: many(CommunityProblemTable),
  friendMatchRequests: many(FriendMatchRequestTable),
}));
