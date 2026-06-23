import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import {
  ArenaProblemConfigTable,
  MatchResultTable,
  MatchTable,
  ProblemTable,
} from "@/db/schema";
import { formatDate } from "@/features/oracle/lib/formatters";
import { User } from "@/lib/auth/auth";
import { formatDistance, formatDistanceToNow } from "date-fns";
import {
  formatDateStringWithAgo,
  formatMatchResultReason,
} from "../lib/formatters";
import { cn, getDuration } from "@/lib/utils";
import {
  CircleXIcon,
  EyeIcon,
  PlayIcon,
  ScaleIcon,
  TrophyIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const UserMatchCard = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect & {
    result: typeof MatchResultTable.$inferSelect | null;
    opponent: User;
    arenaProblem: typeof ArenaProblemConfigTable.$inferSelect & {
      problem: typeof ProblemTable.$inferSelect;
    };
  };
}) => {
  const isFinished =
    match.status === "finished" ||
    (match.expiresAt !== null && match.expiresAt <= new Date());

  const data = [
    {
      label: "Created",
      data: formatDate(match.createdAt),
    },
    {
      label: isFinished ? "Reason" : "Expires in",
      data: isFinished
        ? match.result
          ? formatMatchResultReason(match.result.reason)
          : "Timeout"
        : match.expiresAt
          ? formatDistance(match.expiresAt, new Date())
          : "No time limit",
    },
    {
      label: isFinished ? "Duration" : "Started",
      data: isFinished
        ? match.result || match.expiresAt === null
          ? getDuration(match.createdAt, match.result?.createdAt)
          : getDuration(match.createdAt, match.expiresAt)
        : formatDateStringWithAgo(formatDistanceToNow(match.createdAt)),
    },
  ];

  const getResultBanner = () => {
    return isFinished
      ? match.result?.winnerId == null
        ? {
            icon: <ScaleIcon className="text-gray-500" />,
            result: "Tie",
            bgColor: "bg-gray-500/20",
            textColor: "text-gray-500",
            borderColor: "border border-gray-500",
          }
        : match.result.winnerId === match.opponent.id
          ? {
              icon: <CircleXIcon className="text-destructive/80" />,
              result: "Lost",
              bgColor: "bg-destructive/30",
              textColor: "text-destructive/80",
              borderColor: "border border-destructive/80",
            }
          : {
              icon: <TrophyIcon className="text-emerald-500/80" />,
              result: "Won",
              bgColor: "bg-emerald-500/30",
              textColor: "text-emerald-500/80",
              borderColor: "border border-emerald-500/80",
            }
      : null;
  };

  return (
    <Card className="h-full w-full min-w-0">
      <CardContent className="flex flex-col gap-4 w-full min-w-0 h-full min-h-0">
        <div className="flex items-start w-full min-w-0 gap-2">
          <div className="flex items-center gap-4 w-full min-w-0 flex-1">
            <UserAvatar {...match.opponent} className="size-14" />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0 w-full">
              <span className="text-2xl font-semibold truncate">
                {match.opponent.name}
              </span>
              <span className="text-lg text-muted-foreground truncate">
                {match.opponent.email}
              </span>
            </div>
          </div>
          <Badge variant={isFinished ? "outline" : "default"}>
            {isFinished ? "Completed" : "In Progress"}
          </Badge>
        </div>

        {getResultBanner() && (
          <div
            className={cn(
              "p-4 rounded-lg flex items-center gap-2 justify-center",
              getResultBanner()?.bgColor,
              getResultBanner()?.borderColor,
            )}
          >
            {getResultBanner()?.icon}
            <span
              className={cn(
                "text-xl font-medium",
                getResultBanner()?.textColor,
              )}
            >
              {getResultBanner()?.result}
            </span>
          </div>
        )}

        <Separator />
        <div className="flex flex-col gap-4 w-full">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-between w-full"
            >
              <span className="text-lg text-muted-foreground">
                {item.label}
              </span>
              <span className="text-lg font-medium">{item.data}</span>
            </div>
          ))}
        </div>
        <Separator />
        <LinkButton
          variant={isFinished ? "outline" : "default"}
          className="w-full mt-auto"
          href={
            isFinished
              ? `/arena/matches/${match.id}/results`
              : `/arena/matches/${match.id}`
          }
        >
          {isFinished ? (
            <>
              <EyeIcon />
              View Results
            </>
          ) : (
            <>
              <PlayIcon />
              Resume Match
            </>
          )}
        </LinkButton>
      </CardContent>
    </Card>
  );
};
