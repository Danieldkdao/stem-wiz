import { CodeEditor } from "@/components/code/code-editor";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import {
  ChatMessageTable,
  ChatTable,
  DifficultyLevelType,
  OracleProblemTable,
  OracleSessionTable,
} from "@/db/schema";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";
import { User } from "@/lib/auth/auth";
import { cn, formatTime, getDuration } from "@/lib/utils";
import {
  ArrowLeftIcon,
  BotIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  CodeIcon,
  CompassIcon,
  InfoIcon,
  MessageSquareTextIcon,
  PlayCircleIcon,
  SparklesIcon,
  TagIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react/jsx-runtime";
import {
  formatOracleSessionMode,
  formatSessionDuration,
} from "../lib/formatters";

export const OracleSessionSummaryView = ({
  session,
}: {
  session: typeof OracleSessionTable.$inferSelect & {
    user: User;
    problems: (typeof OracleProblemTable.$inferSelect & {
      chat:
        | (typeof ChatTable.$inferSelect & {
            messages: (typeof ChatMessageTable.$inferSelect)[];
          })
        | null;
    })[];
  };
}) => {
  const infoCards = [
    {
      label: "Completion Rate",
      icon: CheckCircleIcon,
      data: `${Math.round((session.problems.filter((problem) => problem.status === "completed" && problem.completedAt).length / session.problems.length) * 100)}%`,
      iconColor: "text-primary",
    },
    {
      label: "Avg. Score",
      icon: TrophyIcon,
      data: `${(session.problems.reduce((a, b) => a + (b?.score ?? 0), 0) / session.problems.length).toFixed(1)}/10.0`,
      iconColor: "text-yellow-500",
    },
    {
      label: "Messages",
      icon: MessageSquareTextIcon,
      data: session.problems.flatMap((problem) => problem.chat?.messages ?? [])
        .length,
      iconColor: "text-emerald-600",
    },
    {
      label: "Concepts",
      icon: SparklesIcon,
      data: session.problems.flatMap((problem) => problem.concepts).length,
      iconColor: "text-fuchsia-600",
    },
  ];

  const getOracleMathProblemDifficultyBadge = (
    difficulty: DifficultyLevelType,
  ) => {
    switch (difficulty) {
      case "easy":
        return (
          <Badge
            variant="outline"
            className="text-accent border-accent bg-accent/30"
          >
            {formatDifficultyLevel(difficulty)}
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="text-warning border-warning bg-warning/30"
          >
            {formatDifficultyLevel(difficulty)}
          </Badge>
        );
      case "hard":
        return (
          <Badge
            variant="outline"
            className="text-destructive border-destructive bg-destructive/30"
          >
            {formatDifficultyLevel(difficulty)}
          </Badge>
        );
      default:
        throw new Error(
          `Unknown difficulty level: ${difficulty satisfies never}`,
        );
    }
  };

  const metadata = [
    {
      label: "Started",
      data: formatTime(session.startedAt),
      icon: PlayCircleIcon,
    },
    {
      label: "Completed",
      data: formatTime(session.completedAt),
      icon: CheckCircleIcon,
    },
    {
      label: "Duration",
      data: formatSessionDuration(session),
      icon: ClockIcon,
    },
    {
      label: "Language",
      data: formatProgrammingLanguage(session.programmingLanguage),
      icon: CodeIcon,
    },
    {
      label: "Mode",
      data: formatOracleSessionMode(session.mode),
      icon: CompassIcon,
    },
  ];

  const getProblemMetadata = (started: Date | null, completed: Date | null) => [
    {
      label: "Started",
      data: formatTime(started),
    },
    {
      label: "Completed",
      data: formatTime(completed),
    },
    {
      label: "Duration",
      data: getDuration(started, completed),
    },
  ];

  return (
    <div className="flex flex-col items-start gap-4">
      <Button variant="ghost" asChild>
        <Link href="/oracle/sessions">
          <ArrowLeftIcon />
          Back to sessions
        </Link>
      </Button>
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-6xl font-semibold flex-1 truncate">
            {session.title}
          </h1>
          <p
            className={cn(
              "text-muted-foreground text-lg",
              !session.description && "italic",
            )}
          >
            {session.description ?? "No description provided for this session."}
          </p>
        </div>
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {infoCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 justify-between">
                      <span className="text-base font-medium">
                        {card.label}
                      </span>
                      <Icon className={card.iconColor} />
                    </div>
                    <span className="text-4xl font-semibold">{card.data}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-4">
            {metadata.map((data, index) => (
              <Fragment key={index}>
                <div className="flex items-center gap-2">
                  <data.icon className="size-5" />
                  <span className="text-lg font-medium">
                    {data.label}: {data.data}
                  </span>
                </div>
                <Separator className="last:hidden" />
              </Fragment>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-semibold">Problem Breakdown</h2>
          <div className="flex flex-col gap-4">
            {session.problems.map((problem) => (
              <Card key={problem.id}>
                <CardContent className="p-0">
                  <Collapsible className="flex flex-col gap-4">
                    <CollapsibleTrigger className=" px-6 group flex flex-col items-start gap-4 md:items-center md:gap-2 md:flex-row md:justify-between w-full cursor-pointer">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl text-left font-semibold">
                          {problem.order}. {problem.title}
                        </h3>
                        <div className="flex items-center gap-4">
                          {getOracleMathProblemDifficultyBadge(
                            problem.difficulty,
                          )}
                          <span className="text-lg font-medium tracking-widest">
                            Score: {problem.score}/10
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="group-data-[state=open]:text-primary text-lg medium">
                          Expand Details
                        </span>
                        <ChevronRightIcon className="group-data-[state=open]:rotate-90 group-data-[state=open]:text-primary transition-transform duration-300" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-6">
                      <Separator />
                      <div className="px-6 w-full gap-4">
                        <ResizablePanelGroup orientation="horizontal">
                          <ResizablePanel minSize="30%">
                            <div className="min-w-0 flex flex-col gap-4 pr-4">
                              <div className="flex flex-col gap-2">
                                <span className="text-lg text-muted-foreground font-semibold">
                                  Your solution
                                </span>
                                <div className="min-w-0 overflow-hidden">
                                  <CodeEditor
                                    options={{ readOnly: true }}
                                    path={`session:${session.id}:problem:${problem.id}`}
                                    language={problem.language}
                                    value={
                                      problem.userCode ??
                                      "The user did not provide a solution."
                                    }
                                    key={`${session.id}:${problem.id}`}
                                    height={
                                      (problem.userCode?.split(" ").length ??
                                        25) * 4
                                    }
                                    keepCurrentModel
                                  />
                                </div>
                              </div>
                              <div className="border rounded-md border-border p-5 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <TagIcon className="text-primary" />
                                  <span className="text-lg font-semibold text-muted-foreground">
                                    Concepts
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {problem.concepts.map((concept) => (
                                    <Badge
                                      variant="secondary"
                                      key={concept}
                                      className="capitalize"
                                    >
                                      {concept}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="border rounded-md border-border p-5 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <InfoIcon />
                                  <span className="text-lg font-semibold text-muted-foreground">
                                    Metadata
                                  </span>
                                </div>
                                <div className="flex flex-col gap-4">
                                  {getProblemMetadata(
                                    problem.startedAt,
                                    problem.completedAt,
                                  ).map((data, index) => (
                                    <Fragment key={index}>
                                      <div className="flex items-center gap-2 justify-between flex-wrap">
                                        <span className="text-lg text-muted-foreground">
                                          {data.label}
                                        </span>
                                        <span className="text-lg font-semibold">
                                          {data.data}
                                        </span>
                                      </div>
                                      <Separator className="last:hidden" />
                                    </Fragment>
                                  ))}
                                </div>
                              </div>
                              <div className="border rounded-md border-border p-5 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <MessageSquareTextIcon />
                                  <span className="text-lg font-semibold text-muted-foreground">
                                    Chat History
                                  </span>
                                </div>
                                <div className="overflow-y-auto max-h-300 flex flex-col gap-4">
                                  {problem.chat?.messages?.length ? (
                                    problem.chat.messages.map((message) => (
                                      <div
                                        className={cn(
                                          "flex w-full min-w-0 flex-col gap-2 rounded-md p-4",
                                          message.role === "user" &&
                                            "bg-background",
                                        )}
                                        key={message.id}
                                      >
                                        <div className="flex w-full min-w-0 items-start gap-2.5">
                                          {message.role === "user" ? (
                                            <UserAvatar {...session.user} />
                                          ) : (
                                            <div className="size-8 shrink-0 rounded-full flex items-center justify-center bg-muted border border-border">
                                              <BotIcon className="text-primary" />
                                            </div>
                                          )}
                                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-x-hidden">
                                            <div className="flex min-w-0 items-center gap-2">
                                              <h2 className="truncate text-lg font-medium">
                                                {message.role === "user"
                                                  ? `${session.user.name} (You)`
                                                  : "The Oracle"}
                                              </h2>
                                              <span>•</span>
                                              <span className="shrink-0">
                                                {(
                                                  message.createdAt ??
                                                  new Date()
                                                ).toDateString()}
                                              </span>
                                            </div>

                                            {message.role === "user" ? (
                                              <p className="min-w-0 max-w-full wrap-break-word text-base text-muted-foreground">
                                                {message.text}
                                              </p>
                                            ) : (
                                              <MarkdownRenderer className="min-w-0 max-w-full text-base">
                                                {message.text}
                                              </MarkdownRenderer>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <h1 className="text-center mx-auto italic text-lg font-medium">
                                      No chat messages
                                    </h1>
                                  )}
                                </div>
                              </div>
                            </div>
                          </ResizablePanel>
                          <ResizableHandle />
                          <ResizablePanel minSize="30%">
                            <div className="min-w-0 flex flex-col gap-4 pl-4">
                              <div className="flex flex-col gap-2">
                                <span className="text-lg text-muted-foreground font-semibold">
                                  Feedback
                                </span>
                                <MarkdownRenderer>
                                  {problem.feedback ?? ""}
                                </MarkdownRenderer>
                              </div>
                            </div>
                          </ResizablePanel>
                        </ResizablePanelGroup>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
