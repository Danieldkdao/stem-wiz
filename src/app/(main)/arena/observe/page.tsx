import { getObservableMatches } from "@/features/matches/actions/actions";
import { MatchObserverListStatus } from "@/features/matches/components/match-observer-list-status";
import { ObservableMatchCard } from "@/features/matches/components/observable-match-card";
import { Suspense } from "react";

const ObserveMatchesListPage = () => {
  return (
    <Suspense fallback={<ObserveMatchesListLoading />}>
      <ObserverMatchesListSuspense />
    </Suspense>
  );
};

const ObserveMatchesListLoading = () => {
  return <div>loading</div>;
};

const ObserverMatchesListSuspense = async () => {
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
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {matches.map((match) => (
            <ObservableMatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="w-full rounded-md border-2 border-dashed bg-card/75 p-10 flex flex-col gap-2">
          <h1 className="text-xl font-medium text-center">No Matches Found</h1>
          <p className="text-muted-foreground text-center">
            Looks like there are no matches going on right now. If you wait just
            a bit longer, you might be able listen to other platforms.
          </p>
        </div>
      )}
    </div>
  );
};

export default ObserveMatchesListPage;
