"use client";

import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { useWaitingArenaSocket } from "@/features/arena/hooks/use-waiting-arena-socket";
import { useAuthSession } from "@/hooks/use-auth-session";
import { SwordsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { statusMap } from ".";
import { FindingMatchLoader } from "./finding-match-loader";
import { ArenaWaitingServerMessage } from "../lib/types";

const renderWaitingResponse = (message: ArenaWaitingServerMessage) => {
  switch (message.type) {
    case "no_matches_found":
      return (
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-xl font-medium text-center">No Matches Found</h1>
          <p className="text-muted-foreground text-center">
            Just wanted to let you know that there are no users that are online
            at this moment. If someone joins, then we will connect you with that
            person.
          </p>
        </div>
      );
    case "match_found":
      return (
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-xl font-medium text-center">Match Found!</h1>
          <p className="text-muted-foreground text-center">
            You have been matched up with {message.opponent.name}! You are
            being redirected to the battle now. If that did not work, you can
            click on the link below.
          </p>
          <LinkButton
            variant="outline"
            className="w-full"
            href={`/arena/matches/${message.matchId}`}
          >
            Battle!
          </LinkButton>
        </div>
      );
    case "active_match_exists":
      return (
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-xl font-medium text-center">
            Match Still Active
          </h1>
          <p className="text-muted-foreground text-center">
            You already have an active match. Head back to it before joining a
            new waiting room.
          </p>
          <LinkButton
            variant="outline"
            className="w-full"
            href={`/arena/matches/${message.matchId}`}
          >
            Return to Match
          </LinkButton>
        </div>
      );
    case "no_problems_found":
      return (
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-xl font-medium text-center">
            No Problems Found
          </h1>
          <p className="text-muted-foreground text-center">
            Unfortunately, we currently are unable to find any interesting
            problems for your battle. Try refreshing the page or coming back at
            another time.
          </p>
        </div>
      );
    case "no_user_settings":
      return (
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-xl font-medium text-center">No User Settings</h1>
          <p className="text-muted-foreground text-center">
            Please update your preferences and settings so we know what you like
            and who we should pair you up with.
          </p>
          <LinkButton variant="outline" className="w-full" href="/settings">
            Head to settings
          </LinkButton>
        </div>
      );
    case "error":
      return (
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-xl font-medium text-center text-destructive">
            Error
          </h1>
          <p className="text-muted-foreground text-center">
            Looks like something went wrong. Try reloading the page or come back
            another time.
          </p>
        </div>
      );
    default:
      message satisfies never;
      return null;
  }
};

export const ArenaWaitingArea = () => {
  const router = useRouter();
  const {
    status,
    match,
    lastEvent,
    connect,
    joinWaitingRoom,
    clearWaitingState,
  } = useWaitingArenaSocket();
  const { data: session, isPending } = useAuthSession();

  useEffect(() => {
    if (isPending || !session) return;
    if (status === "connecting" || status === "open") return;

    void connect();
  }, [connect, isPending, session, status]);

  useEffect(() => {
    if (!session) return;
    if (status !== "open") return;

    joinWaitingRoom();
  }, [session, status, joinWaitingRoom]);

  useEffect(() => {
    if (status !== "open") return;
    if (!match) return;

    const matchId = match.matchId;
    clearWaitingState();
    router.push(`/arena/matches/${matchId}`);
  }, [clearWaitingState, match, router, status]);

  if (!session) return;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 rounded-md border bg-card flex items-center justify-center gap-2">
        {statusMap[status].element}

        <span className="text-muted-foreground capitalize">
          Status:{" "}
          <span className="capitalize text-foreground font-medium">
            {statusMap[status].label}
          </span>
        </span>
      </div>

      <div className="w-full max-w-100 flex flex-col gap-2">
        {lastEvent?.type !== "no_user_settings" && (
          <Card>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="flex flex-col gap-6 items-center p-4">
                  <UserAvatar
                    {...session.user}
                    className="size-20"
                    textClassName="text-2xl font-medium"
                  />
                  <span className="text-xl font-bold">You</span>
                </div>

                <SwordsIcon className="size-14" strokeWidth={3} />
                {match ? (
                  <div className="flex flex-col gap-6 items-center p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <UserAvatar
                      {...match.opponent}
                      className="size-20"
                      textClassName="text-2xl font-medium"
                    />
                    <span className="text-xl font-bold line-clamp-1">
                      {match.opponent.name}
                    </span>
                  </div>
                ) : (
                  <FindingMatchLoader />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {lastEvent && (
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardContent>{renderWaitingResponse(lastEvent)}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
