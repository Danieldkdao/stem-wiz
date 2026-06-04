import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import {
  difficultyLevelEnum,
  oracleProblemStatusEnum,
  programmingLanguageEnum,
} from "../shared";
import { OracleSessionTable } from "./oracle-session";
import { relations } from "drizzle-orm";
import { ChatTable } from "./chat";

export const OracleProblemTable = pgTable("oracle_problems", {
  id,
  sessionId: uuid("session_id")
    .references(() => OracleSessionTable.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: oracleProblemStatusEnum("status").notNull().default("in-progress"),
  userCode: text("user_code"),
  difficulty: difficultyLevelEnum("difficulty").notNull(),
  starterCode: text("starter_code"),
  language: programmingLanguageEnum("language").notNull(),
  solutionOutline: text("solution_outline").notNull(),
  concepts: jsonb("concepts").$type<string[]>().notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const oracleProblemRelations = relations(
  OracleProblemTable,
  ({ one }) => ({
    session: one(OracleSessionTable, {
      fields: [OracleProblemTable.sessionId],
      references: [OracleSessionTable.id],
    }),
    chat: one(ChatTable),
  }),
);
