"use client";

import { CommunityProblemTable, ProblemTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { useState } from "react";
import { CommunityProblemCard } from "./community-problem-card";

export const CommunityProblemInfiniteCardGrid = ({
  initialProblems,
}: {
  initialProblems: (typeof CommunityProblemTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
    author: User;
  })[];
}) => {
  const [problems, setProblems] = useState(initialProblems);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {problems.map((problem) => (
        <CommunityProblemCard key={problem.id} communityProblem={problem} />
      ))}
    </div>
  );
};
