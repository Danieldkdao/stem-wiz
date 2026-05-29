import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OracleProblemTable, OracleSessionTable } from "@/db/schema";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";
import { SetterType } from "@/lib/types";
import { ArrowLeftIcon, ArrowRightIcon, InfoIcon } from "lucide-react";
import Link from "next/link";
import {
  formatOracleSessionMode,
  formatSessionDuration,
} from "../lib/formatters";
import { Separator } from "@/components/ui/separator";
import { Fragment } from "react/jsx-runtime";
import { Progress } from "@/components/ui/progress";

export const OracleSessionViewHeader = ({
  session,
  problems,
  currentProblemIndex,
  setCurrentProblemIndex,
}: {
  session: typeof OracleSessionTable.$inferSelect;
  problems: (typeof OracleProblemTable.$inferSelect)[];
  currentProblemIndex: number;
  setCurrentProblemIndex: SetterType<number>;
}) => {
  const currentProblem = problems[currentProblemIndex];

  const moveBetweenProblems = (direction: 1 | -1) => {
    const newIndex = currentProblemIndex + direction;
    if (!problems[newIndex]) return;

    setCurrentProblemIndex(newIndex);
  };

  const sessionInformation = [
    {
      title: "Programming Language",
      data: formatProgrammingLanguage(session.programmingLanguage),
    },
    {
      title: "Time Open",
      data: formatSessionDuration(session),
    },
    {
      title: "Mode",
      data: formatOracleSessionMode(session.mode),
    },
    {
      title: "Number of Problems",
      data: `${session.numberOfProblems} ${session.numberOfProblems === 1 ? "problem" : "problems"}`,
    },
  ];

  const completionPercentage =
    (problems.filter(
      (problem) => problem.status === "completed" && problem.completedAt,
    ).length /
      problems.length) *
    100;

  return (
    <header className="w-full p-5 bg-card border-b grid grid-cols-3">
      <div className="w-full flex justify-start place-items-center-safe">
        <Button variant="ghost" asChild>
          <Link href="/oracle/sessions">
            <ArrowLeftIcon />
            Sessions
          </Link>
        </Button>
      </div>
      <div className="flex items-center justify-center gap-4">
        <TooltipWrapper content="Previous problem">
          <Button
            variant="ghost"
            size="icon"
            disabled={!problems[currentProblemIndex - 1]}
            onClick={() => moveBetweenProblems(-1)}
          >
            <ArrowLeftIcon className="size-6" />
          </Button>
        </TooltipWrapper>
        <span className="text-lg text-muted-foreground">
          <span className="text-2xl font-semibold text-foreground">
            {currentProblem.order}{" "}
          </span>
          /{problems.length}
        </span>
        <TooltipWrapper content="Next problem">
          <Button
            variant="ghost"
            size="icon"
            disabled={!problems[currentProblemIndex + 1]}
            onClick={() => moveBetweenProblems(1)}
          >
            <ArrowRightIcon className="size-6" />
          </Button>
        </TooltipWrapper>
      </div>
      <div className="flex items-center justify-end">
        <Dialog>
          <TooltipWrapper content="Session Info" align="end">
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <InfoIcon />
              </Button>
            </DialogTrigger>
          </TooltipWrapper>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">
                Session Info
              </DialogTitle>
              <DialogDescription className="text-base">
                Some basic information about the session and its configurations.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {sessionInformation.map((info, index) => (
                <Fragment key={index}>
                  <div className="w-full flex items-center gap-2 justify-between flex-wrap">
                    <span className="text-muted-foreground text-base">
                      {info.title}
                    </span>
                    <span className="font-semibold text-base">{info.data}</span>
                  </div>
                  <Separator />
                </Fragment>
              ))}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 justify-between flex-wrap">
                  <span className="text-muted-foreground text-base">
                    Session Progress
                  </span>
                  <span className="font-semibold">
                    {Math.round(completionPercentage)}%
                  </span>
                </div>

                <Progress value={completionPercentage} className="w-full" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};
