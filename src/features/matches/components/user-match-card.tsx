import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { MatchResultTable, MatchTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";

export const UserMatchCard = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect & {
    result: typeof MatchResultTable.$inferSelect | null;
    opponent: User;
  };
}) => {
  return (
    <Card className="h-full w-full min-w-0">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4 w-full min-w-0">
          <UserAvatar {...match.opponent} className="size-14" />
          <div className="flex flex-col gap-0.5 flex-1 min-w-0 w-full">
            <span className="text-2xl font-semibold truncate">
              {match.opponent.name}
            </span>
            <span className="text-lg text-muted-foreground">
              {match.opponent.email}
            </span>
          </div>
        </div>
        <Separator />
      </CardContent>
    </Card>
  );
};
