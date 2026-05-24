import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { difficultyLevelEnum, programmingLanguageEnum } from "../shared";
import { OracleSessionTable } from "./oracle-session";
import { relations } from "drizzle-orm";

export const OracleProblemTable = pgTable("oracle_problems", {
  id,
  sessionId: uuid("session_id")
    .references(() => OracleSessionTable.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  difficulty: difficultyLevelEnum("difficulty").notNull(),
  starterCode: text("starter_code"),
  language: programmingLanguageEnum("language").notNull(),
  solutionOutline: text("solution_outline").notNull(),
  concepts: jsonb("concepts").$type<string[]>().notNull(),
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
  }),
);
