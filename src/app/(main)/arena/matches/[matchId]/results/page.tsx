import { CodeEditor } from "@/components/code/code-editor";
import { InfoCard } from "@/components/info-card";
import { LinkButton } from "@/components/link-button";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { NotFound } from "@/components/not-found";
import { RefreshPageButton } from "@/components/refresh-page-button";
import { ResizablePanelMobileGroup } from "@/components/resizable-panel-mobile-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { timeoutExpiredMatch } from "@/features/matches/actions/actions";
import { formatMatchResultReason } from "@/features/matches/lib/formatters";
import { getDifficultyBadge } from "@/features/oracle/lib/formatters";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ParamsId } from "@/lib/types";
import { cn, formatTime, getDuration, getTimeValues } from "@/lib/utils";
import {
  CalendarIcon,
  CircleXIcon,
  ClockIcon,
  CodeIcon,
  FlagIcon,
  GavelIcon,
  HistoryIcon,
  LightbulbIcon,
  LucideIcon,
  ScaleIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment, Suspense } from "react";

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

const NoCode = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-5">
      <span className="text-base font-medium text-muted-foreground text-center">
        No code was submitted.
      </span>
    </div>
  );
};

const MatchResultsSuspense = async ({ params }: MatchCompeteParams) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;
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
    (match.expiresAt === null || match.expiresAt > new Date()) &&
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

  const isMatchParticipant = match.users.find((user) => user.userId === userId);
  const matchWinner = match.users.find(
    (user) => user.userId === match.result?.winnerId,
  );
  const isMatchWinner = matchWinner?.userId === userId;
  const noMatchWinner = !match.result?.winnerId;
  const winningSubmission = match.submissions.find(
    (submission) => submission.userId === matchWinner?.userId,
  );
  const currentUserSubmission = match.submissions.find(
    (submission) => submission.userId === userId,
  );
  const problem = match.arenaProblem.problem;

  const resultStatus = noMatchWinner
    ? ("tie" as const)
    : isMatchParticipant
      ? isMatchWinner
        ? ("won" as const)
        : ("lost" as const)
      : ("won" as const);
  const resultContentMap: Record<
    typeof resultStatus,
    {
      title: string;
      description: string;
      icon: LucideIcon;
      bgColor: string;
      textColor: string;
      iconBgColor: string;
      borderColor: string;
    }
  > = {
    won: {
      title: `${isMatchParticipant ? "You" : matchWinner?.user.name} won the match!`,
      description: `Flawless execution. ${isMatchParticipant ? "You" : matchWinner?.user.name} solved the problem faster and with greater efficiency.`,
      icon: TrophyIcon,
      bgColor: "bg-primary/20",
      textColor: "text-primary",
      iconBgColor: "bg-primary",
      borderColor: "border-primary/50",
    },
    lost: {
      title: "You lost the match.",
      description: `${matchWinner?.user.name} completed the solution faster.`,
      icon: CircleXIcon,
      bgColor: "bg-destructive/20",
      textColor: "text-destructive",
      iconBgColor: "bg-destructive",
      borderColor: "border-destructive/50",
    },
    tie: {
      title: "Match ended in a tie.",
      description:
        "Both users were unable to submit valid solutions within the given timeframe.",
      icon: ScaleIcon,
      bgColor: "bg-muted",
      textColor: "text-foreground",
      iconBgColor: "bg-muted-foreground/80",
      borderColor: "border-muted/50",
    },
  };

  const {
    title: resultTitle,
    description: resultDescription,
    icon: ResultIcon,
    bgColor: resultBgColor,
    iconBgColor: resultIconBgColor,
    textColor: resultTextColor,
    borderColor: resultBorderColor,
  } = resultContentMap[resultStatus];

  const getUserLastSubmission = (userId: string) => {
    const userSubmission = match.submissions.find(
      (submission) => submission.userId === userId,
    );
    const lastSubmission = userSubmission
      ? getTimeValues(
          Math.round(
            (userSubmission.updatedAt.getTime() - match.createdAt.getTime()) /
              1000,
          ),
        )
      : "Did not submit";
    const lastSubmissionText =
      typeof lastSubmission === "string"
        ? lastSubmission
        : `${lastSubmission.hours.toString().padStart(2, "0")}:${lastSubmission.minutes.toString().padStart(2, "0")}:${lastSubmission.seconds.toString().padStart(2, "0")}`;
    return {
      text: lastSubmissionText,
      userSubmission,
    };
  };

  const matchDetails = [
    {
      label: "Created",
      icon: CalendarIcon,
      data: formatTime(match.createdAt),
    },
    {
      label: "Finished",
      icon: FlagIcon,
      data: formatTime(match.result?.createdAt),
    },
    {
      label: "Duration",
      icon: ClockIcon,
      data:
        match.result || match.expiresAt === null
          ? getDuration(match.createdAt, match.result?.createdAt)
          : getDuration(match.createdAt, match.expiresAt),
    },
    {
      label: "End Reason",
      icon: GavelIcon,
      data: match.result
        ? formatMatchResultReason(match.result.reason)
        : "Unknown",
    },
  ];

  const tabContents = [
    {
      value: "your/winning-code",
      content: () =>
        isMatchParticipant ? (
          winningSubmission ? (
            <CodeEditor
              options={{ readOnly: true }}
              value={winningSubmission.code}
              language={problem.programmingLanguage}
              height={500}
            />
          ) : currentUserSubmission ? (
            <CodeEditor
              options={{ readOnly: true }}
              value={currentUserSubmission.code}
              language={problem.programmingLanguage}
              height={500}
            />
          ) : (
            <NoCode />
          )
        ) : currentUserSubmission ? (
          <CodeEditor
            options={{ readOnly: true }}
            value={currentUserSubmission.code}
            language={problem.programmingLanguage}
            height={500}
          />
        ) : (
          <NoCode />
        ),
    },
    {
      value: "submissions",
      content: () => (
        <div className="h-200 w-full min-w-0">
          <ResizablePanelMobileGroup>
            {match.users.map(({ user }) => {
              const isWinner = user.id === matchWinner?.userId;
              const { text: lastSubmissionText, userSubmission } =
                getUserLastSubmission(user.id);

              return (
                <Fragment key={user.id}>
                  <ResizablePanel
                    minSize="30%"
                    className="w-full min-w-0 flex flex-col overflow-hidden min-h-0"
                  >
                    <div className="flex items-center gap-2 w-full min-w-0 p-4 border-b">
                      <UserAvatar
                        {...user}
                        className="size-11"
                        textClassName="text-xs"
                      />
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <div className="w-full min-w-0 flex items-center gap-2">
                          <span className="text-lg font-medium truncate">
                            {user.name}
                          </span>
                          {isWinner ? (
                            <Badge className="rounded-md">Winner</Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-md">
                              Participant
                            </Badge>
                          )}
                        </div>

                        <span className="text-sm text-muted-foreground tracking-wider font-mono truncate">
                          Last submitted at {lastSubmissionText}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 h-full w-full overflow-y-auto min-h-0">
                      {userSubmission ? (
                        <CodeEditor
                          options={{ readOnly: true }}
                          value={userSubmission.code}
                          language={problem.programmingLanguage}
                        />
                      ) : (
                        <NoCode />
                      )}
                    </div>
                  </ResizablePanel>
                  <ResizableHandle className="last:hidden" />
                </Fragment>
              );
            })}
          </ResizablePanelMobileGroup>
        </div>
      ),
    },
    {
      value: "official-solution",
      content: () => (
        <div className="mt-6">
          <MarkdownRenderer>{problem.solution}</MarkdownRenderer>
        </div>
      ),
    },
  ];

  return (
    <div className="py-10 px-6 overflow-auto h-full w-full">
      <div className=" mx-auto max-w-7xl w-full min-w-0">
        <div className="w-full min-w-0 flex flex-col gap-4">
          <div
            className={cn(
              "p-5 rounded-xl border flex items-center gap-4 flex-wrap",
              resultBorderColor,
              resultBgColor,
            )}
          >
            <div
              className={cn(
                "size-20 rounded-full flex items-center justify-center shrink-0",
                resultIconBgColor,
              )}
            >
              <ResultIcon className="size-12" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <h1 className={cn("text-3xl font-semibold", resultTextColor)}>
                {resultTitle}
              </h1>
              <p className="text-lg">{resultDescription}</p>
            </div>
          </div>
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LinkButton variant="outline" href="/matches">
                View matches
              </LinkButton>
              <LinkButton href="/arena/waiting">Start new match</LinkButton>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">{problem.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {formatProgrammingLanguage(problem.programmingLanguage)}
                  </Badge>
                  {getDifficultyBadge(problem.difficultyLevel)}
                </div>
              </div>

              <MarkdownRenderer>{problem.description}</MarkdownRenderer>
              <div className="flex items-center gap-2">
                {problem.concepts.map((concept, index) => (
                  <Badge key={`${concept}-${index}`} variant="outline">
                    {concept}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold">Match Details</h2>
              <Separator />
              <div className="flex flex-col gap-4">
                {matchDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className="w-full flex items-center gap-2 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <detail.icon className="text-muted-foreground size-5" />
                      <span className="text-base text-muted-foreground">
                        {detail.label}
                      </span>
                    </div>
                    <span className="text-base font-medium">{detail.data}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
            {match.users.map(({ user }) => {
              const isWinner = user.id === matchWinner?.userId;

              return (
                <Link
                  key={user.id}
                  href={`/community/user/${user.id}`}
                  className="w-full min-w-0"
                >
                  <Card
                    className={cn(
                      "w-full min-w-0",
                      isWinner && "border-l-4 border-primary!",
                    )}
                  >
                    <CardContent className="flex flex-col gap-4 w-full min-w-0">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          {...user}
                          className="size-14"
                          textClassName="text-lg"
                        />
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <span className="text-xl font-medium truncate">
                              {user.name}
                            </span>
                            {isWinner ? (
                              <Badge className="rounded-md">Winner</Badge>
                            ) : (
                              <Badge className="rounded-md" variant="outline">
                                Participant
                              </Badge>
                            )}
                          </div>

                          <span className="text-base text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <Separator />
                      <span className="text-base text-muted-foreground">
                        Last submitted at:{" "}
                        <span className="text-foreground font-medium">
                          {getUserLastSubmission(user.id).text}
                        </span>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <Card>
            <CardContent>
              <Tabs defaultValue="your/winning-code">
                <div>
                  <TabsList variant="line">
                    <TabsTrigger value="your/winning-code">
                      <CodeIcon />
                      {isMatchParticipant
                        ? `Your Code${isMatchWinner ? " (Winning)" : ""}`
                        : "Winning Code"}
                    </TabsTrigger>
                    <TabsTrigger value="submissions">
                      <HistoryIcon />
                      Submissions
                    </TabsTrigger>
                    <TabsTrigger value="official-solution">
                      <LightbulbIcon />
                      Official Solution
                    </TabsTrigger>
                  </TabsList>
                  <Separator />
                  {tabContents.map((tabContent) => (
                    <TabsContent
                      key={tabContent.value}
                      value={tabContent.value}
                    >
                      <tabContent.content />
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MatchResultsPage;
