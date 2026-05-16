"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Separator } from "@/components/ui/separator";
import { EyeIcon, LogOutIcon, TimerIcon } from "lucide-react";
import { MatchFinishedDialog } from "./match-finished-dialog";
import { useEffect, useState } from "react";
import { MatchSubmissionTable, MatchTable, UserMatchTable } from "@/db/schema";
import { cn, getTimeValues } from "@/lib/utils";
import { useMatchObserverSocket } from "../hooks/use-match-observer-socket";
import { toast } from "sonner";
import { statusMap } from "@/features/arena/components";

type ObservableMatchHeaderProps = {
  match: typeof MatchTable.$inferSelect & {
    submissions: (typeof MatchSubmissionTable.$inferSelect)[];
    users: (typeof UserMatchTable.$inferSelect)[];
  };
};

export const ObservableMatchHeader = ({
  match,
}: ObservableMatchHeaderProps) => {
  const { connect, subscribeObserverMatch, status, error, matchObserverCount } =
    useMatchObserverSocket();
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.max(0, Math.ceil((match.expiresAt.getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (status === "connecting" || status === "open") return;

    connect();
  }, [status]);

  useEffect(() => {
    if (status !== "open") return;

    subscribeObserverMatch(match.id);
  }, [status]);

  useEffect(() => {
    if (error) {
      toast.error(
        error ||
          "Something went wrong behind the scenes. Please refresh the page.",
      );
    }
  }, [error]);

  useEffect(() => {
    if (secondsRemaining <= 0 && match.status === "in-progress") {
      return;
    }
    const interval = setInterval(async () => {
      if (secondsRemaining <= 0 && match.status === "in-progress") {
        return;
      }
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, match.status]);

  const timeValues = getTimeValues(secondsRemaining);

  return (
    <>
      <MatchFinishedDialog
        open={finishDialogOpen}
        setOpen={() => {
          if (finishDialogOpen) return;
        }}
        matchId={match.id}
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
