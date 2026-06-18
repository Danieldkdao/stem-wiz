import { relations } from "drizzle-orm";
import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { MatchTable } from "./match";
import { ProblemTable } from "./problem";

export const ArenaProblemConfigTable = pgTable("arena_problem_configs", {
  id,
  problemId: uuid("problem_id")
    .references(() => ProblemTable.id, {
      onDelete: "no action",
    })
    .notNull(),
  timeLimit: integer("time_limit").notNull(),
  createdAt,
  updatedAt,
});

export const arenaProblemConfigRelations = relations(
  ArenaProblemConfigTable,
  ({ one, many }) => ({
    problem: one(ProblemTable, {
      fields: [ArenaProblemConfigTable.problemId],
      references: [ProblemTable.id],
    }),
    matches: many(MatchTable),
  }),
);
