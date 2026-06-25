import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { getMatchObserverAccessAction } from "../actions/actions";
import { formatMatchObserverInvitationStatus } from "../lib/formatters";
import { UpdateMatchObserverInvitationStatusButton } from "./update-match-observer-invitation-status-button";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import Link from "next/link";

export const MatchObserversList = ({ matchId }: { matchId: string }) => {
  const {
    data: matchObservers,
    error,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["match_observers"],
    queryFn: () => getMatchObserverAccessAction(matchId),
  });

  if (isPending) {
    return <MatchObserversListSkeleton />;
  }
  if (error)
    return (
      <div className="p-5 flex w-full items-center gap-2">
        <p className="text-lg font-medium text-destructive text-center">
          Due to an unexpected error, we were unable to fetch the data. Try
          refreshing the page.
        </p>
      </div>
    );
  if (!matchObservers) {
    return (
      <div className="p-5 flex w-full items-center gap-2">
        <p className="text-lg font-medium text-muted-foreground text-center">
          No data was found. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">
      {/* todo: maybe add realtime observer status in the future? */}
      {matchObservers.length ? (
        matchObservers.map(({ id, user, status }) => (
          <div
            key={id}
            className="p-4 rounded-md flex items-center gap-2 w-full min-w-0"
          >
            <Link
              href={`/community/user/${user.id}`}
              className="flex items-center gap-2 flex-1 min-w-0"
              target="_blank"
            >
              <UserAvatar {...user} />
              <span className="text-lg font-medium truncate">{user.name}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "rounded-md",
                  status === "accepted" &&
                    "bg-accent/20 border-accent/50 text-accent",
                  status === "pending" &&
                    "bg-warning/20 border-warning/50 text-warning",
                )}
              >
                {formatMatchObserverInvitationStatus(status)}
              </Badge>
              <TooltipWrapper content="Revoke access">
                <UpdateMatchObserverInvitationStatusButton
                  matchObserverInvitationId={id}
                  newStatus="revoked"
                  afterAction={() => refetch()}
                  variant="destructive"
                  size="icon"
                >
                  <XIcon />
                </UpdateMatchObserverInvitationStatusButton>
              </TooltipWrapper>
            </div>
          </div>
        ))
      ) : (
        <div className="w-full flex items-center justify-center">
          <span className="text-center font-medium text-muted-foreground text-lg">
            No match observers yet. Invite your friends to get started.
          </span>
        </div>
      )}
    </div>
  );
};

const MatchObserversListSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-2 min-w-0">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="p-4 rounded-md flex items-center gap-2 w-full min-w-0"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
