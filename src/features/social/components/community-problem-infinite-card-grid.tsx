"use client";

import { CommunityProblemTable, ProblemTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { CommunityProblemCard } from "./community-problem-card";

export const CommunityProblemInfiniteCardGrid = ({
  initialProblems,
}: {
  initialProblems: (typeof CommunityProblemTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
    author: User;
  })[];
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {initialProblems.map((problem) => (
        <CommunityProblemCard key={problem.id} communityProblem={problem} />
      ))}
    </div>
  );
};
