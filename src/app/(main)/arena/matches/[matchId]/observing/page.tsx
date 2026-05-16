import { checkExistingMatchAction } from "@/features/matches/actions/actions";
import { ObservableMatchHeader } from "@/features/matches/components/observable-match-header";
import { ObserverMatchView } from "@/features/matches/components/observer-match-view";
import { NUMBER_OF_ALLOWED_MATCH_PARTICIPANTS } from "@/lib/constants";
import { ParamsId } from "@/lib/types";
import { Suspense } from "react";

type MatchObservingProps = ParamsId<"matchId">;

const MatchObservingPage = (props: MatchObservingProps) => {
  return (
    <Suspense fallback={<MatchObservingLoading />}>
      <MatchObservingSuspense {...props} />
    </Suspense>
  );
};

const MatchObservingLoading = () => {
  return <div>loading</div>;
};

const MatchObservingSuspense = async ({ params }: MatchObservingProps) => {
  const { matchId } = await params;
  const match = await checkExistingMatchAction({ id: matchId });

  if (!match) {
    return <div>reusable match not found component</div>;
  }

  if (
    match.users.length < NUMBER_OF_ALLOWED_MATCH_PARTICIPANTS ||
    match.users.length > NUMBER_OF_ALLOWED_MATCH_PARTICIPANTS
  ) {
    return (
      <div>something went wrong please try again or come back another time</div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      <ObservableMatchHeader match={match} />
      <ObserverMatchView match={match} />
    </div>
  );
};

export default MatchObservingPage;
