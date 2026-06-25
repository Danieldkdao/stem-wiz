import { LinkButton } from "@/components/link-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { MatchObserverInvitationStatusType } from "@/db/shared";
import { cn, formatTime } from "@/lib/utils";
import { formatDistance, formatDistanceToNow } from "date-fns";
import {
  BanIcon,
  CheckCircle2Icon,
  Clock3Icon,
  EyeIcon,
  FlagIcon,
  InboxIcon,
  SendIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  TimerOffIcon,
  TrophyIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react";
import { getUserMatchObserverInvitationsAction } from "../actions/actions";
import {
  formatDateStringWithAgo,
  formatMatchObserverInvitationStatus,
} from "../lib/formatters";
import { AcceptMatchObserverInvitationButton } from "./accept-match-observer-invitation-button";
import { UpdateMatchObserverInvitationStatusButton } from "./update-match-observer-invitation-status-button";

type MatchObserverInvitation = NonNullable<
  Awaited<ReturnType<typeof getUserMatchObserverInvitationsAction>>
>["matchObserverInvitations"][number];

type StatusConfig = {
  icon: LucideIcon;
  className: string;
};

const statusConfig = {
  pending: {
    icon: Clock3Icon,
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  accepted: {
    icon: CheckCircle2Icon,
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  rejected: {
    icon: XCircleIcon,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  expired: {
    icon: TimerOffIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
  revoked: {
    icon: ShieldOffIcon,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
} satisfies Record<MatchObserverInvitationStatusType, StatusConfig>;

const getMatchAvailability = (match: MatchObserverInvitation["match"]) => {
  const expiresAt = match.expiresAt ? new Date(match.expiresAt) : null;

  if (match.status === "finished") {
    return {
      label: "Match ended",
      description: "Results are available",
      icon: FlagIcon,
      className: "border-border bg-muted text-muted-foreground",
      isLive: false,
      isFinished: true,
    };
  }

  if (expiresAt && expiresAt <= new Date()) {
    return {
      label: "Expired",
      description: "This match is no longer live",
      icon: TimerOffIcon,
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      isLive: false,
      isFinished: false,
    };
  }

  return {
    label: "Live",
    description: expiresAt
      ? `Ends in ${formatDistance(expiresAt, new Date())}`
      : "No time limit",
    icon: EyeIcon,
    className: "border-primary/30 bg-primary/10 text-primary",
    isLive: true,
    isFinished: false,
  };
};

const getInvitationCopy = ({
  isSent,
  isReceived,
  status,
  isMatchFinished,
}: {
  isSent: boolean;
  isReceived: boolean;
  status: MatchObserverInvitationStatusType;
  isMatchFinished: boolean;
}) => {
  if (isMatchFinished && status === "pending") {
    return "The match ended before this invitation was answered.";
  }

  if (isMatchFinished && status === "accepted") {
    return isSent
      ? "Observer access was granted before the match ended."
      : "You can review the finished match results.";
  }

  switch (status) {
    case "pending":
      return isSent
        ? "Waiting for your friend to respond."
        : "You were invited to observe this match.";
    case "accepted":
      return isSent
        ? "Your friend has observer access."
        : "You can observe this match live.";
    case "rejected":
      return isReceived
        ? "You declined this observer invitation."
        : "The invited friend declined this observer invitation.";
    case "expired":
      return isReceived
        ? "This invitation expired before you responded."
        : "This invitation expired without a response.";
    case "revoked":
      return isReceived
        ? "Observer access was revoked."
        : "You revoked this observer invitation/access.";
    default:
      throw new Error(
        `Unknown observer invitation status: ${status satisfies never}`,
      );
  }
};

const formatCreatedAt = (date: Date | string | number) =>
  formatDateStringWithAgo(formatDistanceToNow(new Date(date)));

const ParticipantList = ({
  participants,
}: {
  participants: MatchObserverInvitation["participants"];
}) => {
  if (!participants.length) return null;

  if (participants.length === 2) {
    const [firstParticipant, secondParticipant] = participants;

    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <UserAvatar
            {...firstParticipant.user}
            className="size-8 shrink-0"
            textClassName="text-xs"
          />
          <span className="min-w-0 truncate font-medium text-lg">
            {firstParticipant.user.name}
          </span>
        </div>
        <span className="shrink-0 text-base font-semibold uppercase text-muted-foreground">
          vs
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="min-w-0 truncate text-right font-medium text-lg">
            {secondParticipant.user.name}
          </span>
          <UserAvatar
            {...secondParticipant.user}
            className="size-8 shrink-0"
            textClassName="text-xs"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {participants.map((participant) => (
        <div
          key={participant.userId}
          className="flex min-w-0 items-center gap-2"
        >
          <UserAvatar
            {...participant.user}
            className="size-7 shrink-0"
            textClassName="text-xs"
          />
          <span className="min-w-0 truncate text-lg font-medium">
            {participant.user.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MatchObserverInvitationCard = ({
  currentUserId,
  matchObserverInvitation,
}: {
  currentUserId: string;
  matchObserverInvitation: MatchObserverInvitation;
}) => {
  const { match, participants, problem, status } = matchObserverInvitation;
  const isSent = matchObserverInvitation.inviterUserId === currentUserId;
  const isReceived = matchObserverInvitation.invitedUserId === currentUserId;
  const directionLabel = isSent ? "Sent" : "Received";
  const DirectionIcon = isSent ? SendIcon : InboxIcon;
  const StatusIcon = statusConfig[status].icon;
  const matchAvailability = getMatchAvailability(match);
  const MatchAvailabilityIcon = matchAvailability.icon;
  const canRespond =
    isReceived && status === "pending" && matchAvailability.isLive;
  const canRevoke =
    isSent &&
    (status === "pending" || status === "accepted") &&
    matchAvailability.isLive;
  const canWatch = status === "accepted" && matchAvailability.isLive;
  const canViewResults = status === "accepted" && matchAvailability.isFinished;
  const copy = getInvitationCopy({
    isSent,
    isReceived,
    status,
    isMatchFinished: matchAvailability.isFinished,
  });

  return (
    <Card className="h-full min-w-0">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "border-primary/30 bg-primary/10 text-primary",
              isSent && "border-border bg-secondary text-secondary-foreground",
            )}
          >
            <DirectionIcon />
            {directionLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn("capitalize", statusConfig[status].className)}
          >
            <StatusIcon />
            {formatMatchObserverInvitationStatus(status)}
          </Badge>
          <Badge
            variant="outline"
            className={cn("ml-auto", matchAvailability.className)}
          >
            <MatchAvailabilityIcon />
            {matchAvailability.label}
          </Badge>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="truncate text-2xl font-semibold">
            {problem.title}
          </CardTitle>
          <p className="line-clamp-2 text-lg text-muted-foreground">{copy}</p>
        </div>
      </CardHeader>

      <CardContent className="flex min-w-0 flex-1 flex-col gap-4">
        <ParticipantList participants={participants} />

        <Separator />

        <div className="grid gap-2 text-lg">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-muted-foreground">Match</span>
            <span className="min-w-0 truncate text-right font-medium">
              {matchAvailability.description}
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-muted-foreground">Sent</span>
            <span className="min-w-0 truncate text-right font-medium">
              {formatCreatedAt(matchObserverInvitation.createdAt)}
            </span>
          </div>
          {matchObserverInvitation.respondedAt && (
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="text-muted-foreground">Responded</span>
              <span className="min-w-0 truncate text-right font-medium">
                {formatTime(matchObserverInvitation.respondedAt)}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-2 border-t pt-6 sm:flex-row">
        {canViewResults ? (
          <LinkButton
            href={`/arena/matches/${match.id}/results`}
            variant="outline"
            className="w-full sm:flex-1"
          >
            <TrophyIcon />
            View results
          </LinkButton>
        ) : canWatch ? (
          <LinkButton
            href={
              isSent
                ? `/arena/matches/${match.id}`
                : `/arena/matches/${match.id}/observing`
            }
            className="w-full"
          >
            {isSent ? <ShieldCheckIcon /> : <EyeIcon />}
            {isSent ? "View match" : "Watch match"}
          </LinkButton>
        ) : canRespond ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <AcceptMatchObserverInvitationButton
              matchObserverInvitationId={matchObserverInvitation.id}
              className="w-full sm:flex-1"
            >
              <CheckCircle2Icon />
              Accept invite
            </AcceptMatchObserverInvitationButton>
            <UpdateMatchObserverInvitationStatusButton
              matchObserverInvitationId={matchObserverInvitation.id}
              newStatus="rejected"
              variant="destructive"
              className="w-full sm:flex-1"
            >
              <XCircleIcon />
              Decline
            </UpdateMatchObserverInvitationStatusButton>
          </div>
        ) : canRevoke ? (
          <UpdateMatchObserverInvitationStatusButton
            matchObserverInvitationId={matchObserverInvitation.id}
            newStatus="revoked"
            variant="destructive"
            className="w-full sm:flex-1"
          >
            <BanIcon />
            Revoke invite
          </UpdateMatchObserverInvitationStatusButton>
        ) : (
          <p className="w-full text-center text-sm text-muted-foreground">
            {copy}
          </p>
        )}
      </CardFooter>
    </Card>
  );
};
