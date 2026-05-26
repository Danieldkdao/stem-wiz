import { Button } from "@/components/ui/button";
import { OracleProblemTable, OracleSessionTable } from "@/db/schema";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const OracleSessionViewHeader = ({
  session,
  currentProblem,
  problemCount,
}: {
  session: typeof OracleSessionTable.$inferSelect;
  currentProblem: typeof OracleProblemTable.$inferSelect;
  problemCount: number;
}) => {
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
      <div className="flex items-center justify-center">
        <span className="truncate text-lg font-medium text-muted-foreground text-center">
          {session.title}
        </span>
      </div>
      <div className="flex items-center justify-end">
        <span className="text-lg text-muted-foreground">
          <span className="text-2xl font-semibold text-foreground">
            {currentProblem.order}{" "}
          </span>
          /{problemCount} {problemCount === 1 ? "problem" : "problems"}
        </span>
      </div>
    </header>
  );
};
