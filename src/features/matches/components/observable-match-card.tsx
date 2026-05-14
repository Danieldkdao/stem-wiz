import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { ArenaProblemTable, MatchTable, UserMatchTable } from "@/db/schema";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";
import { User } from "@/lib/auth/auth";
import Link from "next/link";

export const ObservableMatchCard = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect & {
    arenaProblem: typeof ArenaProblemTable.$inferSelect;
    users: (typeof UserMatchTable.$inferSelect & { user: User })[];
  };
}) => {
  return (
    <Link href={`/arena/matches/${match.id}/observing`}>
      <Card>
        <CardContent className="w-full h-full flex flex-col items-center gap-2">
          <h1 className="text-xl font-medium text-center">
            {match.arenaProblem.title}
          </h1>
          <div className="flex items-center gap-2">
            <Badge size="sm">
              {formatProgrammingLanguage(
                match.arenaProblem.programmingLanguage,
              )}
            </Badge>
            <Badge size="sm">
              {formatDifficultyLevel(match.arenaProblem.difficultyLevel)}
            </Badge>
          </div>
          <div className="mt-2 flex w-full min-w-0 flex-col items-center gap-1">
            <span className="text-muted-foreground font-medium">
              Participants
            </span>
            <div className="flex w-full min-w-0 flex-col items-center gap-1">
              {match.users.map((user) => (
                <div
                  className="flex w-full min-w-0 items-center justify-center gap-2"
                  key={user.userId}
                >
                  <UserAvatar
                    {...user.user}
                    className="size-6 shrink-0"
                    textClassName="text-xs"
                  />
                  <span className="min-w-0 max-w-[calc(100%-2rem)] truncate text-sm font-medium">
                    {user.user.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
