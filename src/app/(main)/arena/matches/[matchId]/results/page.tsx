import { checkExistingMatch } from "@/features/matches/actions/actions";
import { ParamsId } from "@/lib/types";
import { Suspense } from "react";

type MatchCompeteParams = ParamsId<"matchId">;

const MatchResultsPage = (props: MatchCompeteParams) => {
  return (
    <Suspense fallback={<MatchResultsLoading />}>
      <MatchResultsSuspense {...props} />
    </Suspense>
  );
};

const MatchResultsLoading = () => {
  return <div>loading</div>;
};

const MatchResultsSuspense = async ({ params }: MatchCompeteParams) => {
  const { matchId } = await params;
  const match = await checkExistingMatch({ id: matchId, forResults: true });

  if (!match) {
    return <div>reusable match not found component</div>;
  }

  if (
    match.users.length !== match.submissions.length &&
    match.expiresAt > new Date()
  ) {
    return <div>still going on</div>;
  }

  return <div>{JSON.stringify(match)}</div>;
};

export default MatchResultsPage;
