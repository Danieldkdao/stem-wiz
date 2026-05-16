"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Separator } from "@/components/ui/separator";
import { EyeIcon, LogOutIcon, TimerIcon } from "lucide-react";
import { MatchFinishedDialog } from "./match-finished-dialog";
import { useEffect, useState } from "react";
import {
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
  UserMatchTable,
} from "@/db/schema";
import { cn, getTimeValues } from "@/lib/utils";
import { useMatchObserverSocket } from "../hooks/use-match-observer-socket";
import { toast } from "sonner";
import { statusMap } from "@/features/arena/components";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth/auth";

type ObservableMatchHeaderProps = {
  match: typeof MatchTable.$inferSelect & {
    submissions: (typeof MatchSubmissionTable.$inferSelect)[];
    users: (typeof UserMatchTable.$inferSelect & { user: User })[];
    result?: typeof MatchResultTable.$inferSelect | null;
  };
};

export const ObservableMatchHeader = ({
  match,
}: ObservableMatchHeaderProps) => {
  const router = useRouter();
  const {
    connect,
    subscribeObserverMatch,
    status,
    error,
    matchObserverCount,
    matchCompletionReason,
    lastEvent,
  } = useMatchObserverSocket();
  const expiresAtMs = match.expiresAt.getTime();
  const [now, setNow] = useState(() => Date.now());

  const secondsRemaining = Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
  const isMatchFinished =
    lastEvent?.type === "match_finished" ||
    !!(match.result && match.status === "finished");

  useEffect(() => {
    if (status === "connecting" || status === "open" || isMatchFinished) return;

    connect();
  }, [status]);

  useEffect(() => {
    if (status !== "open" || isMatchFinished) return;

    subscribeObserverMatch(match.id);
  }, [status]);

  useEffect(() => {
    if (isMatchFinished) return;
    if (error) {
      toast.error(
        error ||
          "Something went wrong behind the scenes. Please refresh the page.",
      );
    }
  }, [error]);

  useEffect(() => {
    if (isMatchFinished) return;
    if (status !== "open" && match.status === "in-progress") return;
    if (lastEvent?.type === "user_submitted_code") {
      const user = match.users.find((user) => user.userId === user.userId);
      toast.success(`${user?.user.name || "User"} has submitted their code.`);
      router.refresh();
    }
    if (lastEvent?.type === "error") {
      toast.error(error ?? "Something went wrong behind the scenes.");
    }
  }, [status, lastEvent, match.status]);

  useEffect(() => {
    if (isMatchFinished) return;
    if (secondsRemaining <= 0 && match.status === "in-progress") return;
    setNow(Date.now());
    const interval = setInterval(async () => {
      if (secondsRemaining <= 0 && match.status === "in-progress") return;
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAtMs]);

  const timeValues = getTimeValues(secondsRemaining);

  return (
    <>
      <MatchFinishedDialog
        open={isMatchFinished}
        setOpen={() => {
          if (isMatchFinished) return;
        }}
        matchId={match.id}
        reason={match.result?.reason ?? matchCompletionReason ?? undefined}
      />

      <div className="w-full py-4 grid grid-cols-3 border-b bg-background/50 px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {statusMap[status].element}
            <span className="font-medium">{statusMap[status].label}</span>
          </div>
          <Separator orientation="vertical" />
          <div className="flex items-center gap-2">
            <EyeIcon />
            <span>{matchObserverCount}</span>
          </div>
        </div>
        <div className="w-full flex items-center justify-center">
          <div className="flex items-center gap-2">
            <TimerIcon className="text-muted-foreground" />
            <span
              className={cn(
                "tabular-nums font-semibold text-lg",
                secondsRemaining <= 10 && "text-destructive",
              )}
            >
              {timeValues.hours.toString().padStart(2, "0")}:
              {timeValues.minutes.toString().padStart(2, "0")}:
              {timeValues.seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="flex justify-end items-center">
          <Button variant="destructive">
            <LoadingSwap isLoading={false}>Leave</LoadingSwap>
            <LogOutIcon />
          </Button>
        </div>
      </div>
    </>
  );
};
