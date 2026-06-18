import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import {
  oracleSessionModeEnum,
  oracleSessionStatusEnum,
  programmingLanguageEnum,
} from "../shared";
import { OracleSessionProblemTable } from "./oracle-problem";
import { user } from "./user";

export const OracleSessionTable = pgTable("oracle_sessions", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  programmingLanguage: programmingLanguageEnum(
    "programming_language",
  ).notNull(),
  numberOfProblems: integer("number_of_problems").notNull(),
  status: oracleSessionStatusEnum("status").notNull().default("upcoming"),
  mode: oracleSessionModeEnum("mode").notNull(),
  additionalInstructions: text("additional_instructions"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const oracleSessionRelations = relations(
  OracleSessionTable,
  ({ one, many }) => ({
    user: one(user, {
      fields: [OracleSessionTable.userId],
      references: [user.id],
    }),
    problems: many(OracleSessionProblemTable),
  }),
);
