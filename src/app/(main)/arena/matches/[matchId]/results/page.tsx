import { CodeEditor } from "@/components/code/code-editor";
import { InfoCard } from "@/components/info-card";
import { LinkButton } from "@/components/link-button";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { NotFound } from "@/components/not-found";
import { RefreshPageButton } from "@/components/refresh-page-button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { timeoutExpiredMatch } from "@/features/matches/actions/actions";
import { auth } from "@/lib/auth/auth";
import { ParamsId } from "@/lib/types";
import { headers } from "next/headers";
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
  return (
    <div className="py-10 px-6 overflow-auto h-full">
      <div className="mx-auto w-full max-w-250">
        <Card>
          <CardContent className="flex flex-col gap-4 items-center w-full">
            <Skeleton className="h-8 w-full max-w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-150">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Separator />
            <div className="flex flex-col gap-4 w-full mb-4">
              <Skeleton className="h-7 w-44 self-center" />
              <div className="overflow-hidden rounded-md border bg-background">
                <div className="flex h-10 items-center gap-2 border-b px-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-8/12" />
                  <Skeleton className="h-4 w-10/12" />
                  <Skeleton className="h-4 w-7/12" />
                  <Skeleton className="h-4 w-9/12" />
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-4 w-full">
              <Skeleton className="h-7 w-40 self-center" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
              </div>
              <div className="space-y-3 pt-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-9/12" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MatchResultsSuspense = async ({ params }: MatchCompeteParams) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { matchId } = await params;
  const match = await timeoutExpiredMatch(matchId);

  if (!match) {
    return (
      <div className="w-full h-full py-10 px-6">
        <NotFound
          title="Match not found"
          description="We couldn't find this match. Try checking the url or refreshing the page."
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <LinkButton
              href="/matches"
              variant="outline"
              className="w-full md:flex-1"
            >
              Back to matches
            </LinkButton>
            <RefreshPageButton className="w-full md:flex-1">
              Reload the page
            </RefreshPageButton>
          </div>
        </NotFound>
      </div>
    );
  }

  if (
    match.users.length !== match.submissions.length &&
    match.expiresAt > new Date() &&
    match.status !== "finished"
  ) {
    return (
      <div className="w-full h-full py-10 px-6">
        <InfoCard
          title="Match still ongoing"
          description="This match is still ongoing. If you are a participant, jump back in to finish it. Otherwise you can watch the match."
        >
          <div className="w-full mx-auto flex flex-col gap-2 md:flex-row md:items-center max-w-150">
            <LinkButton
              variant="outline"
              className="w-full md:flex-1"
              href={`/arena/matches/${match.id}/observing`}
            >
              Watch match
            </LinkButton>
            <LinkButton
              className="w-full md:flex-1"
              href={`/arena/matches/${match.id}`}
            >
              Resume match
            </LinkButton>
          </div>
        </InfoCard>
      </div>
    );
  }

  const wasMatchParticipant = match.users.find(
    (user) => user.userId === session.user.id,
  );
  const matchWinner = match.users.find(
    (user) => user.userId === match.result?.winnerId,
  );
  const isMatchWinner = matchWinner?.userId === session.user.id;
  const noMatchWinner = !match.result?.winnerId;
  const winningSubmission = match.submissions.find(
    (submission) => submission.userId === matchWinner?.userId,
  );
  const problem = match.arenaProblem.problem;

  return (
    <div className="py-10 px-6 overflow-auto h-full">
      <div className="mx-auto w-full max-w-250">
        <Card>
          <CardContent className="flex flex-col gap-4 items-center w-full">
            <h1 className="text-2xl font-semibold">
              {noMatchWinner
                ? "This match ended in a stalemate."
                : wasMatchParticipant
                  ? isMatchWinner
                    ? "Congratulations! You won the match!"
                    : "Sorry, not this time."
                  : `The winner is ${matchWinner?.user.name}!`}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-150">
              <LinkButton className="w-full" href="/arena/waiting">
                Start New Match
              </LinkButton>
              <LinkButton
                variant="outline"
                className="w-full"
                href="/dashboard"
              >
                Back to Dashboard
              </LinkButton>
            </div>
            <Separator />
            {winningSubmission && (
              <div className="flex flex-col gap-4 w-full mb-4">
                <h2 className="text-xl font-medium text-center">
                  {isMatchWinner ? "Your" : "Winning"} Solution
                </h2>

                <CodeEditor
                  language={problem.programmingLanguage}
                  path={`match:${matchId}:self`}
                  defaultValue={winningSubmission.code}
                  height={700}
                  options={{ readOnly: true }}
                  key={match.id}
                  keepCurrentModel
                />
              </div>
            )}
            <Separator />
            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-xl font-medium text-center">
                Problem Solution
              </h2>
              <MarkdownRenderer>{problem.solution}</MarkdownRenderer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatchResultsPage;
