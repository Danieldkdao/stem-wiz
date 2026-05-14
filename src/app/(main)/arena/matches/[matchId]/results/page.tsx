import { CodeEditor } from "@/components/code/code-editor";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { checkExistingMatch } from "@/features/matches/actions/actions";
import { auth } from "@/lib/auth/auth";
import { ParamsId } from "@/lib/types";
import { headers } from "next/headers";
import Link from "next/link";
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
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

  const wasMatchParticipant = match.users.find(
    (user) => user.userId === session.user.id,
  );
  const matchWinner = match.users.find(
    (user) => user.userId === match.result?.winnerId,
  );
  const isMatchWinner = matchWinner?.userId === session.user.id;
  const winningSubmission = match.submissions.find(
    (submission) => submission.userId === matchWinner?.userId,
  );

  return (
    <div className="py-10 px-6 overflow-auto h-full">
      <div className="mx-auto w-full max-w-250">
        <Card>
          <CardContent className="flex flex-col gap-4 items-center w-full">
            <h1 className="text-2xl font-semibold">
              {wasMatchParticipant
                ? isMatchWinner
                  ? "Congratulations! You won the match!"
                  : "Sorry, not this time."
                : `The winner is ${matchWinner?.user.name}!`}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-150">
              <Button className="w-full" asChild>
                <Link href="/arena/waiting">Start New Match</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-4 w-full mb-4">
              <h2 className="text-xl font-medium text-center">
                {isMatchWinner ? "Your" : "Winning"} Solution
              </h2>
              {winningSubmission ? (
                <CodeEditor
                  language={match.arenaProblem.programmingLanguage}
                  existingSubmission={winningSubmission}
                  height={700}
                  readOnly
                />
              ) : (
                <div className="text-center font-medium text-muted-foreground">
                  No winning solution found. Try refreshing the page or maybe it
                  wasn't saved.
                </div>
              )}
            </div>
            <Separator />
            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-xl font-medium text-center">
                Problem Solution
              </h2>
              <MarkdownRenderer>{match.arenaProblem.solution}</MarkdownRenderer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatchResultsPage;
