import { Skeleton } from "@/components/ui/skeleton";
import { getObservableMatches } from "@/features/matches/actions/actions";
import { MatchObserverListStatus } from "@/features/matches/components/match-observer-list-status";
import { ObservableMatchCard } from "@/features/matches/components/observable-match-card";
import { connection } from "next/server";
import { Suspense } from "react";

const ObserveMatchesListPage = () => {
  return (
    <Suspense fallback={<ObserveMatchesListLoading />}>
      <ObserverMatchesListSuspense />
    </Suspense>
  );
};

const ObserveMatchesListLoading = () => {
  return (
    <div className="flex flex-col gap-4 py-10 px-6 w-full h-full overflow-auto">
      <div className="flex flex-col gap-2 items-center">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-full max-w-96" />
      </div>

      <div className="w-full mx-auto max-w-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="rounded-xl border bg-card text-card-foreground shadow-xs"
            key={index}
          >
            <div className="w-full h-full flex flex-col items-center gap-2 p-6">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="mt-2 flex w-full min-w-0 flex-col items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex w-full min-w-0 flex-col items-center gap-2">
                  <ParticipantSkeleton />
                  <ParticipantSkeleton />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ParticipantSkeleton = () => {
  return (
    <div className="flex w-full min-w-0 items-center justify-center gap-2">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
};

const ObserverMatchesListSuspense = async () => {
  await connection();
  const matches = await getObservableMatches();

  return (
    <div className="flex flex-col gap-4 py-10 px-6 w-full h-full overflow-auto">
      <div className="flex flex-col gap-2 items-center">
        <MatchObserverListStatus />
        <h1 className="text-2xl font-semibold text-center">Observe</h1>
        <p className="text-muted-foreground text-center">
          Find some ongoing matches to jump into and observe.
        </p>
      </div>

      {matches.length ? (
        <div className="w-full mx-auto max-w-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {matches.map((match) => (
            <ObservableMatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="w-full mx-auto max-w-300 rounded-md border-2 border-dashed bg-card/75 p-10 flex flex-col gap-2">
          <h1 className="text-xl font-medium text-center">No Matches Found</h1>
          <p className="text-muted-foreground text-center">
            Looks like there are no matches going on right now. Try waiting
            around a bit more or coming back later to see if any new matches
            have started.
          </p>
        </div>
      )}
    </div>
  );
};

export default ObserveMatchesListPage;
