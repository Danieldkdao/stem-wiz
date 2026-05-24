import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { oracleSessionModeEnum, oracleSessionStatusEnum } from "../shared";
import { OracleProblemTable } from "./oracle-problem";
import { user } from "./user";

export const OracleSessionTable = pgTable("oracle_sessions", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  numberOfProblems: integer("number_of_problems").notNull(),
  status: oracleSessionStatusEnum("status").notNull().default("active"),
  mode: oracleSessionModeEnum("mode").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
    problems: many(OracleProblemTable),
  }),
);
