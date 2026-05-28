import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { OracleProblemTable, OracleSessionTable } from "@/db/schema";
import { SetterType } from "@/lib/types";
import { ArrowLeftIcon, ArrowRightIcon, InfoIcon } from "lucide-react";
import Link from "next/link";

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
        <TooltipWrapper content="Session Info" align="end">
          <Button variant="ghost" size="icon">
            <InfoIcon />
          </Button>
        </TooltipWrapper>
      </div>
    </header>
  );
};
