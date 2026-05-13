"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { useWaitingArenaSocket } from "@/features/arena/hooks/use-waiting-arena-socket";
import { useAuthSession } from "@/hooks/use-auth-session";
import { SwordsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JSX, useEffect } from "react";
import { statusMap } from ".";
import { FindingMatchLoader } from "./finding-match-loader";
import { ArenaWaitingServerMessageType } from "../lib/types";

const responseMap: Record<
  ArenaWaitingServerMessageType,
  (...args: any) => JSX.Element
> = {
  no_matches_found: () => (
    <div className="flex flex-col gap-2 items-center">
      <h1 className="text-xl font-medium text-center">No Matches Found</h1>
      <p className="text-muted-foreground text-center">
        Just wanted to let you know that there are no users that are online at
        this moment. If someone joins, then we will connect you with that
        person.
      </p>
    </div>
  ),
  match_found: ({ name, matchId }: { name: string; matchId: string }) => (
    <div className="flex flex-col gap-2 items-center">
      <h1 className="text-xl font-medium text-center">Match Found!</h1>
      <p className="text-muted-foreground text-center">
        You have been matched up with {name}! You are being redirected to the
        battle now! If that didn't work, you can click on the link below.
      </p>
      <Button variant="outline" className="w-full">
        <Link href={`/arena/matches/${matchId}`}>Battle!</Link>
      </Button>
    </div>
  ),
  no_problems_found: () => (
    <div className="flex flex-col gap-2 items-center">
      <h1 className="text-xl font-medium text-center">No Problems Found</h1>
      <p className="text-muted-foreground text-center">
        Unfortunately, we currently are unable to find any interesting problems
        for your battle. Try refreshing the page or coming back at another time.
      </p>
    </div>
  ),
  no_user_settings: () => (
    <div className="flex flex-col gap-2 items-center">
      <h1 className="text-xl font-medium text-center">No User Settings</h1>
      <p className="text-muted-foreground text-center">
        Please update your preferences and settings so we know what you like and
        who we should pair you up with!
      </p>
      <Button variant="outline" className="w-full">
        <Link href={`/settings`}>Head to settings</Link>
      </Button>
    </div>
  ),
  error: () => (
    <div className="flex flex-col gap-2 items-center">
      <h1 className="text-xl font-medium text-center text-destructive">
        Error
      </h1>
      <p className="text-muted-foreground text-center">
        Looks like something went wrong. Try reloading the page or come back
        another time.
      </p>
    </div>
  ),
};

export const ArenaWaitingArea = () => {
  const router = useRouter();
  const { status, match, lastEvent, connect, joinWaitingRoom } =
    useWaitingArenaSocket();
  const { data: session, isPending } = useAuthSession();

  useEffect(() => {
    if (isPending || !session) return;
    if (status === "connecting" || status === "open") return;

    void connect();
  }, [isPending, session, status]);

  useEffect(() => {
    if (!session) return;
    if (status !== "open") return;

    joinWaitingRoom();
  }, [session, status, joinWaitingRoom]);

  useEffect(() => {
    if (status !== "open") return;
    if (match) router.push(`/arena/matches/${match.matchId}`);
  }, [status, match]);

  if (!session) return;

  const MessageComponent = lastEvent ? responseMap[lastEvent.type] : () => null;

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

        {lastEvent && MessageComponent && (
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardContent>
              <MessageComponent
                name={
                  lastEvent.type === "match_found"
                    ? lastEvent.opponent.name
                    : undefined
                }
                matchId={
                  lastEvent.type === "match_found"
                    ? lastEvent.matchId
                    : undefined
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
