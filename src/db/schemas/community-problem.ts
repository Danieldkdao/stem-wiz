import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { ProblemTable } from "./problem";
import { user } from "./user";
import { communityProblemStatusEnum } from "../shared";
import { relations } from "drizzle-orm";

export const CommunityProblemTable = pgTable("community_problems", {
  id,
  problemId: uuid("problem_id")
    .references(() => ProblemTable.id, { onDelete: "cascade" })
    .notNull(),
  authorUserId: text("author_user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  status: communityProblemStatusEnum("status").notNull(),
  createdAt,
  updatedAt,
});

export const communityProblemRelations = relations(
  CommunityProblemTable,
  ({ one }) => ({
    problem: one(ProblemTable, {
      fields: [CommunityProblemTable.problemId],
      references: [ProblemTable.id],
    }),
    author: one(user, {
      fields: [CommunityProblemTable.authorUserId],
      references: [user.id],
    }),
  }),
);
