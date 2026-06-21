"use client";

import { NotFound } from "@/components/not-found";
import {
  CommunityProblemInvitationTable,
  CommunityProblemTable,
  ProblemTable,
} from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { getCommunityProblemsAction } from "../actions/actions";
import { useCommunityProblemParams } from "../hooks/use-community-problem-params";
import { CommunityProblemCard } from "./community-problem-card";

export const CommunityProblemInfiniteCardGrid = ({
  userId,
  initialProblems,
  initialHasNextPage,
}: {
  userId: string;
  initialProblems: (typeof CommunityProblemTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
    invitations: (typeof CommunityProblemInvitationTable.$inferSelect)[];
    author: User;
    isCurrentUserAuthor: boolean;
  })[];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useCommunityProblemParams();
  const [problems, setProblems] = useState(initialProblems);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProblems(initialProblems);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialProblems, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const { communityProblems, metadata } =
            await getCommunityProblemsAction(userId, {
              ...filters,
              page: nextPage,
            });
          setProblems((currentProblems) => [
            ...currentProblems,
            ...communityProblems,
          ]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [filters, page, hasNextPage, isPending]);

  return problems.length ? (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {problems.map((problem) => (
        <CommunityProblemCard key={problem.id} communityProblem={problem} />
      ))}

      <div ref={sentinelRef} className="w-full h-1 bg-transparent" />
      {isPending && (
        <div className="flex items-center justify-center w-full">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
    </div>
  ) : (
    <NotFound
      title="Problems not found"
      description="We were unable find any problems that match the selected filters. Try adjusting your filters or refresh the page."
    />
  );
};
