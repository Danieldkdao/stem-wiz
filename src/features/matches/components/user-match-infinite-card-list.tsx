"use client";

import { ArenaProblemTable, MatchResultTable, MatchTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { useEffect, useRef, useState, useTransition } from "react";
import { useUserMatchParams } from "../hooks/use-user-match-params";
import { getUserMatchesAction } from "../actions/actions";
import { Loader2Icon, SearchXIcon } from "lucide-react";
import { UserMatchCard } from "./user-match-card";

export const UserMatchInfiniteCardList = ({
  initialMatches,
  initialHasNextPage,
}: {
  initialMatches: (typeof MatchTable.$inferSelect & {
    result: typeof MatchResultTable.$inferSelect | null;
    opponent: User;
    arenaProblem: typeof ArenaProblemTable.$inferSelect;
  })[];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useUserMatchParams();
  const [matches, setMatches] = useState(initialMatches);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMatches(initialMatches);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialMatches, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getUserMatchesAction({
            ...filters,
            page: nextPage,
          });
          if (!response) return;

          const { matches, metadata } = response;

          setMatches((prev) => [...prev, ...matches]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [filters, hasNextPage, isPending, page]);

  return (
    <div>
      {matches.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {matches.map((match) => (
            <UserMatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="px-4 bg-card py-8 rounded-xl border-4 border-border border-dashed flex flex-col items-center justify-center w-full">
          <SearchXIcon className="size-10" />
          <h2 className="text-2xl font-semibold text-center">
            No matches found
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-150">
            We couldn't find any matches that match the select filters. Maybe
            try again with different filters or a different search query.
          </p>
        </div>
      )}
      <div ref={sentinelRef} className="w-full h-1 bg-transparent" />
      {isPending && (
        <div className="flex items-center justify-center w-full">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
    </div>
  );
};
