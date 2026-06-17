import { ErrorState } from "@/components/error-state";
import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  checkExistingMatchAction,
  isUserMatchActiveAction,
} from "@/features/matches/actions/actions";
import { MatchHeader } from "@/features/matches/components/match-header";
import { MatchView } from "@/features/matches/components/match-view";
import { auth } from "@/lib/auth/auth";
import { ParamsId } from "@/lib/types";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type MatchCompeteParams = ParamsId<"matchId">;

const MatchCompetePage = (props: MatchCompeteParams) => {
  return (
    <Suspense fallback={<MatchCompeteLoading />}>
      <MatchCompeteSuspense {...props} />
    </Suspense>
  );
};

const MatchCompeteLoading = () => {
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full py-4 grid grid-cols-3 border-b bg-background/50 px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1">
        <div className="w-[34%] min-w-80 border-r bg-card/75 p-4 sm:p-6">
          <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
            <Skeleton className="h-9 w-3/4" />
            <div className="mb-2 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="h-px w-full bg-border" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-8/12" />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 border-b bg-background">
            <div className="flex h-full flex-col">
              <div className="flex h-10 items-center gap-2 border-b px-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-9/12" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-8/12" />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-card/60">
            <div className="flex h-full flex-col">
              <div className="flex h-12 items-center justify-between border-b px-4">
                <Skeleton className="h-5 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-7/12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchCompeteSuspense = async ({ params }: MatchCompeteParams) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { matchId } = await params;
  const match = await checkExistingMatchAction({ id: matchId });

  if (!match) {
    const completedMatch = await checkExistingMatchAction({
      id: matchId,
      forResults: true,
    });
    if (
      completedMatch &&
      (completedMatch.status === "finished" ||
        completedMatch.expiresAt <= new Date())
    ) {
      return redirect(`/arena/matches/${matchId}/results`);
    }

    return (
      <div className="w-full h-full py-10 px-6">
        <NotFound
          title="Match not found"
          description="We couldn't find this match. Try checking the url or refreshing the page."
        />
      </div>
    );
  }

  const existingParticipant = await isUserMatchActiveAction(match.id);
  if (!existingParticipant) {
    return (
      <div className="w-full h-full py-10 px-6">
        <ErrorState
          title="Hold on right there."
          description={`You are not a participant in this match. ${match.status === "in-progress" ? "If you want to watch this match," : "If you want to view the match results,"} you can click on the button below.`}
        >
          <div className="mt-2 w-full max-w-150 flex flex-col md:flex-row md:items-center gap-2">
            <Button variant="outline" asChild className="md:flex-1 w-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button className="md:flex-1 w-full" asChild>
              <Link
                href={
                  match.status === "in-progress"
                    ? `/arena/matches/${match.id}/observing`
                    : `/arena/matches/${match.id}/results`
                }
              >
                {match.status === "in-progress"
                  ? "Observe this match"
                  : "View match results"}
              </Link>
            </Button>
          </div>
        </ErrorState>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      <MatchHeader match={match} />
      <MatchView match={match} currentUserId={session.user.id} />
    </div>
  );
};

export default MatchCompetePage;
