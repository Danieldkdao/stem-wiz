"use client";

import { ArenaProblemTable, MatchTable, UserMatchTable } from "@/db/schema";
import { ObservableMatchCard } from "@/features/matches/components/observable-match-card";
import { useObservableMatchParams } from "@/features/matches/hooks/use-observable-match-params";
import { useObservableMatches } from "@/features/matches/hooks/use-observable-matches";
import { User } from "@/lib/auth/auth";
import { SearchXIcon } from "lucide-react";

export const ObservableMatchInfiniteCardGrid = ({
  initialMatches,
  hasNextPage,
}: {
  initialMatches: (typeof MatchTable.$inferSelect & {
    arenaProblem: typeof ArenaProblemTable.$inferSelect;
    users: (typeof UserMatchTable.$inferSelect & { user: User })[];
  })[];
  hasNextPage: boolean;
}) => {
  const [filters] = useObservableMatchParams();
  const matches = useObservableMatches(initialMatches, hasNextPage);

  const hasFilters = filters.search.trim() || filters.languages.length > 1;

  return matches.length ? (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {matches.map((match) => (
        <ObservableMatchCard key={match.id} match={match} />
      ))}
    </div>
  ) : (
    <div className="w-full rounded-md border-2 border-dashed bg-card/75 p-10 flex flex-col gap-2 items-center">
      <SearchXIcon className="size-10" />
      <h1 className="text-2xl font-semibold text-center">No Matches Found</h1>
      <p className="text-lg text-muted-foreground text-center max-w-150">
        {hasFilters
          ? `We couldn't find any currently active matches that match the selected filters. Try changing the filter options or refreshing the page.`
          : `Looks like there are no matches going on right now. Try waiting around a
        bit more or coming back later to see if any new matches have started.`}
      </p>
    </div>
  );
};
