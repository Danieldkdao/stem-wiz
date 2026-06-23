import { LinkButton } from "@/components/link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatShortDate, getDuration, getTimeValues } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  BanIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleEllipsisIcon,
  CircleXIcon,
  CodeIcon,
  EyeIcon,
  HourglassIcon,
  InboxIcon,
  Loader2Icon,
  LoaderCircleIcon,
  PlayCircleIcon,
  RefreshCcwIcon,
  SendIcon,
  TimerOffIcon,
  Trash2Icon,
  TrophyIcon,
  XIcon,
} from "lucide-react";
import { MatchRequest, MatchRequestDisplayStatus } from "./types";
import { formatDateStringWithAgo } from "./formatters";

export const getMatchRequestStatus = (matchRequest: MatchRequest) => {
  const matchRequestStatus = matchRequest.status;
  if (matchRequest.expiresAt && matchRequest.expiresAt <= new Date())
    return "expired" as const;
  switch (matchRequestStatus) {
    case "pending":
      return matchRequest.isSent
        ? ("user_send_pending" as const)
        : ("user_received_pending" as const);
    case "expired":
    case "cancelled":
    case "rejected":
      return matchRequestStatus;
    case "accepted":
      if (!matchRequest.match) return "accepted_preparing" as const;
      if (
        matchRequest.match.expiresAt <= new Date() ||
        matchRequest.match.status === "finished"
      )
        return "accepted_finished" as const;
      return "accepted_active" as const;
  }
};

export const getMatchRequestStatusContent = (
  status: MatchRequestDisplayStatus,
  matchRequest: MatchRequest,
) => {
  switch (status) {
    case "accepted_active":
      return {
        information: () => {
          const { hours, minutes, seconds } = getTimeValues(
            (matchRequest.match?.expiresAt.getTime() ?? 0) -
              new Date().getTime(),
          );

          return (
            <div className="flex items-center gap-2 justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium">Time Remaining</span>
                <span className="text-2xl font-semibold text-primary tracking-widest">
                  {matchRequest.match ? (
                    <>
                      <span className="tracking-wide">{hours}</span>:
                      <span className="tracking-wide">{minutes}</span>:
                      <span className="tracking-wide">{seconds}</span>
                    </>
                  ) : (
                    "No time limit"
                  )}
                </span>
              </div>
            </div>
          );
        },
        cta: () => (
          <LinkButton href={`/arena/matches/${matchRequest.matchId}`}>
            <CodeIcon />
            Resume Match
          </LinkButton>
        ),
        badge: () => (
          <Badge className="rounded-md">
            <PlayCircleIcon />
            Active
          </Badge>
        ),
        icon: PlayCircleIcon,
        text: "Accepted",
        date: matchRequest.respondedAt,
      };
    case "accepted_finished":
      return {
        information: () => {
          const { winner, textColor } = matchRequest.matchResult?.winnerId
            ? matchRequest.matchResult.winnerId === matchRequest.friend.id
              ? {
                  winner: matchRequest.friend.name,
                  textColor: "text-destructive",
                }
              : { winner: "You", textColor: "text-accent" }
            : { winner: "Tie", textColor: "text-muted" };

          return (
            <div className="w-full grid grid-cols-2 gap-2">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium text-muted-foreground">
                  Completed
                </span>
                <span className="text-lg">
                  {formatShortDate(matchRequest.matchResult?.createdAt)}
                </span>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium text-muted-foreground">
                  Winner
                </span>
                <span className={cn("text-lg", textColor)}>{winner}</span>
              </div>
            </div>
          );
        },
        cta: () => (
          <LinkButton
            href={`/arena/matches/${matchRequest.matchId}/results`}
            className="w-full"
          >
            <EyeIcon />
            View Results
          </LinkButton>
        ),
        badge: () => (
          <Badge variant="secondary" className="rounded-md">
            <CheckCircleIcon />
            Finished
          </Badge>
        ),
        icon: TrophyIcon,
        text: "Accepted",
        date: matchRequest.respondedAt,
      };
    case "accepted_preparing":
      return {
        information: () => null,
        cta: () => (
          <Button variant="secondary" disabled className="w-full">
            <Loader2Icon className="animate-spin" />
            Preparing Match
          </Button>
        ),
        badge: () => (
          <Badge
            variant="outline"
            className="border-accent bg-accent/20 rounded-md"
          >
            <RefreshCcwIcon className="animate-spin" />
            Preparing
          </Badge>
        ),
        icon: LoaderCircleIcon,
        text: "Accepted",
        date: matchRequest.respondedAt,
      };
    case "cancelled":
      return {
        information: () => null,
        cta: () => (
          <div className="w-full flex items-center justify-start">
            <span className="text-base font-medium text-muted-foreground">
              Cancelled on {formatShortDate(matchRequest.updatedAt)}
            </span>
          </div>
        ),
        badge: () => (
          <Badge variant="secondary" className="rounded-md">
            <BanIcon />
            Cancelled
          </Badge>
        ),
        icon: BanIcon,
        text: "Cancelled",
        date: matchRequest.updatedAt,
      };
    case "expired":
      return {
        information: () => null,
        cta: () => (
          <div className="flex items-center gap-2 justify-between">
            <span className="text-base font-medium text-muted-foreground">
              Expired{" "}
              {matchRequest.expiresAt &&
                formatDateStringWithAgo(
                  formatDistanceToNow(matchRequest.expiresAt),
                )}
            </span>
            <Button variant="outline" size="icon">
              <Trash2Icon />
            </Button>
          </div>
        ),
        badge: () => (
          <Badge variant="secondary" className="rounded-md">
            <TimerOffIcon />
            Expired
          </Badge>
        ),
        icon: TimerOffIcon,
        text: "Expired",
        date: matchRequest.expiresAt,
      };
    case "rejected":
      return {
        information: () => null,
        cta: () => (
          <div className="w-full flex items-center justify-start">
            <span className="text-base font-medium text-muted-foreground">
              Responded on {formatShortDate(matchRequest.respondedAt)}
            </span>
          </div>
        ),
        badge: () => (
          <Badge variant="destructive" className="rounded-md">
            <CircleXIcon />
            Rejected
          </Badge>
        ),
        icon: CircleXIcon,
        text: "Rejected",
        date: matchRequest.respondedAt,
      };
    case "user_send_pending":
      return {
        information: () => (
          <div className="w-full grid grid-cols-2 gap-2">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-muted-foreground">
                Sent
              </span>
              <span className="text-lg">
                {formatDateStringWithAgo(
                  formatDistanceToNow(matchRequest.createdAt),
                )}
              </span>
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-muted-foreground">
                Expires
              </span>
              <span className="text-lg">
                {matchRequest.expiresAt
                  ? `in ${getDuration(new Date(), matchRequest.expiresAt)}`
                  : "Never"}
              </span>
            </div>
          </div>
        ),
        cta: () => (
          <div className="w-full flex items-center gap-2 justify-between">
            <span className="text-muted-foreground text-base font-medium">
              Awaiting response...
            </span>
            <Button variant="outline">
              <BanIcon />
              Cancel
            </Button>
          </div>
        ),
        badge: () => (
          <Badge variant="secondary" className="rounded-md">
            <HourglassIcon />
            Sent
          </Badge>
        ),
        icon: SendIcon,
        text: "Pending",
        date: matchRequest.createdAt,
      };
    case "user_received_pending":
      return {
        information: () => (
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-muted-foreground">
                Created
              </span>
              <span className="text-lg">
                {formatDateStringWithAgo(
                  formatDistanceToNow(matchRequest.createdAt),
                )}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-muted-foreground">
                Expires
              </span>
              <span className="text-lg">
                {matchRequest.expiresAt
                  ? `in ${getDuration(new Date(), matchRequest.expiresAt)}`
                  : "Never"}
              </span>
            </div>
          </div>
        ),
        cta: () => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button className="w-full">
              <CheckIcon />
              Accept
            </Button>
            <Button variant="destructive" className="w-full">
              <XIcon />
              Reject
            </Button>
          </div>
        ),
        badge: () => (
          <Badge variant="secondary" className="rounded-md">
            <CircleEllipsisIcon />
            Pending
          </Badge>
        ),
        icon: InboxIcon,
        text: "Pending",
        date: matchRequest.createdAt,
      };
  }
};
