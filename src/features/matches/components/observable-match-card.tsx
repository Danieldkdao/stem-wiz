import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import {
  ArenaProblemConfigTable,
  MatchTable,
  ProblemTable,
  UserMatchTable,
} from "@/db/schema";
import { getDifficultyBadge } from "@/features/oracle/lib/formatters";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { User } from "@/lib/auth/auth";
import { getTimeValues } from "@/lib/utils";
import { CircleDotIcon, ClockIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export const ObservableMatchCard = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect & {
    arenaProblem: typeof ArenaProblemConfigTable.$inferSelect & {
      problem: typeof ProblemTable.$inferSelect;
    };
    users: (typeof UserMatchTable.$inferSelect & { user: User })[];
  };
}) => {
  const problem = match.arenaProblem.problem;
  const timeRemaining = match.expiresAt
    ? getTimeValues(
        Math.round((match.expiresAt.getTime() - new Date().getTime()) * 1000),
      )
    : null;
  const timeRemainingString = timeRemaining
    ? timeRemaining.hours > 0
      ? `${timeRemaining.hours} hr`
      : timeRemaining.minutes > 0
        ? `${timeRemaining.minutes} min`
        : `${timeRemaining.seconds} sec`
    : "No time limit";

  return (
    <Link
      href={`/arena/matches/${match.id}/observing`}
      className="w-full h-full min-w-0"
    >
      <Card className="w-full h-full min-w-0">
        <CardContent className="w-full h-full flex flex-col gap-4 min-w-0">
          <div className="flex flex-col gap-2 w-full min-w-0">
            <div className="flex items-center gap-2 justify-between w-full">
              <Badge variant="destructive">
                <CircleDotIcon />
                Live
              </Badge>
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-primary" />
                <span className="text-primary font-medium">
                  {timeRemainingString}
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-semibold truncate">{problem.title}</h2>
            <p className="text-lg text-muted-foreground line-clamp-2">
              {problem.description}
            </p>
            <div className="flex items-center gap-2">
              <Badge className="rounded-md" variant="secondary">
                {formatProgrammingLanguage(problem.programmingLanguage)}
              </Badge>
              {getDifficultyBadge(problem.difficultyLevel, "rounded-md")}
            </div>
          </div>

          <Separator />
          <div className="flex items-center gap-4 w-full min-w-0">
            {match.users.map(({ user }) => (
              <Fragment key={user.id}>
                <div className="flex flex-col items-center gap-1">
                  <UserAvatar {...user} className="size-12" />
                  <span className="text-sm font-medium text-center truncate">
                    {user.name}
                  </span>
                </div>
                <span className="text-base font-medium text-muted-foreground text-center last:hidden">
                  VS
                </span>
              </Fragment>
            ))}
          </div>
          <Button className="w-full">
            <EyeIcon />
            Observe Match
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};
