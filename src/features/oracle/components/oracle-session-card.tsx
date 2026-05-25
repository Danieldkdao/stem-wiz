import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OracleSessionTable } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  formatOracleSessionMode,
  formatOracleSessionStatus,
} from "../lib/formatters";
import { Separator } from "@/components/ui/separator";
import {
  ORACLE_SESSION_MODE_ICONS,
  ORACLE_SESSION_STATUS_ICONS,
} from "../lib/constants";
import { ClockIcon, LucideIcon, SquareStackIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const OracleSessionCard = ({
  session,
}: {
  session: typeof OracleSessionTable.$inferSelect;
}) => {
  const StatusIcon = ORACLE_SESSION_STATUS_ICONS[session.status];
  const ModeIcon = ORACLE_SESSION_MODE_ICONS[session.mode];

  const listPoints: { icon: LucideIcon; data: string }[] = [
    {
      icon: ModeIcon,
      data: formatOracleSessionMode(session.mode),
    },
    {
      icon: SquareStackIcon,
      data: `${session.numberOfProblems} ${session.numberOfProblems === 1 ? "problem" : "problems"}`,
    },
    {
      icon: ClockIcon,
      data: session.startedAt
        ? `${(session.completedAt?.getTime() ?? Date.now()) - session.startedAt.getTime()}`
        : "Not Started",
    },
  ];

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="truncate text-xl font-semibold">
          {session.title}
        </CardTitle>
        <CardDescription
          className={cn("line-clamp-2", !session.description && "italic")}
        >
          {session.description || "No description provided for this session"}
        </CardDescription>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge>
            <StatusIcon />
            {formatOracleSessionStatus(session.status)}
          </Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-4 w-full h-full">
        <div className="flex-1 flex flex-col gap-4">
          {listPoints.map((point) => {
            const PointIcon = point.icon;

            return (
              <div className="flex items-center gap-2">
                <PointIcon className="text-muted-foreground size-5" />
                <span className="text-muted-foreground text-base font-medium">
                  {point.data}
                </span>
              </div>
            );
          })}
        </div>
        <Button
          variant={
            session.status === "upcoming" || session.status === "active"
              ? "default"
              : "outline"
          }
          disabled={
            session.status === "completed" || session.status === "abandoned"
          }
          className="w-full"
        >
          {session.status === "upcoming"
            ? "Start session"
            : session.status === "active"
              ? "Resume session"
              : session.status === "completed"
                ? "Session completed"
                : "Session abandoned"}
        </Button>
      </CardContent>
    </Card>
  );
};
