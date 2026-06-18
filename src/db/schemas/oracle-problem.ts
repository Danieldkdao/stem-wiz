import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { oracleProblemStatusEnum } from "../shared";
import { ChatTable } from "./chat";
import { OracleSessionTable } from "./oracle-session";
import { ProblemTable } from "./problem";

export const OracleSessionProblemTable = pgTable("oracle_session_problems", {
  id,
  problemId: uuid("problem_id")
    .references(() => ProblemTable.id, {
      onDelete: "no action",
    })
    .notNull(),
  sessionId: uuid("session_id")
    .references(() => OracleSessionTable.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  status: oracleProblemStatusEnum("status").notNull().default("in-progress"),
  userCode: text("user_code"),
  score: integer("score"),
  feedback: text("feedback"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const oracleSessionProblemRelations = relations(
  OracleSessionProblemTable,
  ({ one }) => ({
    session: one(OracleSessionTable, {
      fields: [OracleSessionProblemTable.sessionId],
      references: [OracleSessionTable.id],
    }),
    problem: one(ProblemTable, {
      fields: [OracleSessionProblemTable.problemId],
      references: [ProblemTable.id],
    }),
    chat: one(ChatTable),
  }),
);
