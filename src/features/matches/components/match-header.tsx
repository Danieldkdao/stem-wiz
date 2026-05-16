"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
  UserMatchTable,
} from "@/db/schema";
import { statusMap } from "@/features/arena/components";
import { useConfirm } from "@/hooks/use-confirm";
import { cn, getTimeValues } from "@/lib/utils";
import { useMatchStore } from "@/store/use-match-store";
import { TimerIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  handleMatchTimeoutAction,
  handleUserMatchWinAction,
  quitMatchAction,
} from "../actions/actions";
import { useMatchSocket } from "../hooks/use-match-socket";
import { Separator } from "@/components/ui/separator";
import { MatchFinishedDialog } from "./match-finished-dialog";

export const MatchHeader = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect & {
    result?: typeof MatchResultTable.$inferSelect | null;
    submissions: (typeof MatchSubmissionTable.$inferSelect)[];
    users: (typeof UserMatchTable.$inferSelect)[];
  };
}) => {
  const isEnding = useMatchStore((state) => state.isEnding);
  const setIsEnding = useMatchStore((state) => state.setIsEnding);
  const router = useRouter();
  const expiresAtMs = match.expiresAt.getTime();
  const [now, setNow] = useState(() => Date.now());
  const secondsRemaining = Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
  const [disconnectSecondsRemaining, setDisconnectSecondsRemaining] =
    useState(30);
  const {
    connect,
    connectToMatch,
    status,
    opponentStatus,
    lastEvent,
    error,
    broadcastMatchFinished,
  } = useMatchSocket();
  const [confirmationDialog, confirm] = useConfirm(
    "Confirm Leave",
    "Are you sure you want to quit this match?",
  );
  const isMatchFinished =
    lastEvent?.type === "match_finished" ||
    !!(match.result && match.status === "finished");

  useEffect(() => {
    if (status === "connecting" || status === "open" || isMatchFinished) return;

    void connect();
  }, [connect, status, match.status]);

  useEffect(() => {
    if (status !== "open" || isMatchFinished) return;

    connectToMatch(match.id);
  }, [connectToMatch, match.id, status, match.status, isMatchFinished]);

  useEffect(() => {
    if (isMatchFinished) return;
    if (secondsRemaining <= 0 && match.status === "in-progress") {
      handleMatchTimeout();
      return;
    }
    setNow(Date.now());
    const interval = setInterval(async () => {
      if (secondsRemaining <= 0 && match.status === "in-progress") {
        await handleMatchTimeout();
        return;
      }
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, match.status, isMatchFinished]);

  useEffect(() => {
    if (isMatchFinished) return;
    if (opponentStatus === "active" && match.status === "in-progress") {
      setDisconnectSecondsRemaining(30);
      return;
    }
    if (disconnectSecondsRemaining <= 0 && match.status === "in-progress") {
      handleUserMatchWin();
      return;
    }
    const interval = setInterval(async () => {
      if (disconnectSecondsRemaining <= 0 && match.status === "in-progress") {
        await handleUserMatchWin();
        return;
      }
      setDisconnectSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [
    opponentStatus,
    disconnectSecondsRemaining,
    match.status,
    isMatchFinished,
  ]);

  useEffect(() => {
    if (isMatchFinished) return;
    if (status !== "open" && match.status === "in-progress") return;
    if (
      lastEvent?.type === "opponent_submitted_code" &&
      match.submissions.length === 0
    ) {
      toast.success("Your opponent has submitted their code.");
      router.refresh();
    }
    if (lastEvent?.type === "error") {
      toast.error(error ?? "Something went wrong behind the scenes.");
    }
  }, [status, lastEvent, match.status]);

  const timeValues = getTimeValues(secondsRemaining);

  const handleMatchQuit = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    setIsEnding(true);

    broadcastMatchFinished(match.id, "user_quit");
    const response = await quitMatchAction(match.id);
    if (response.error) {
      toast.error(response.message);
      setIsEnding(false);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  };

  const handleMatchTimeout = async () => {
    setIsEnding(true);
    broadcastMatchFinished(match.id, "timeout");
    const response = await handleMatchTimeoutAction(match.id);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  };

  const handleUserMatchWin = async () => {
    setIsEnding(true);
    broadcastMatchFinished(match.id, "user_lost_connection");
    const response = await handleUserMatchWinAction(match.id);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  };

  return (
    <>
      {confirmationDialog}
      <MatchFinishedDialog
        open={isMatchFinished}
        setOpen={() => {
          if (isMatchFinished) return;
        }}
        matchId={match.id}
        reason={match.result?.reason}
      />
      <div className="flex flex-col w-full">
        {opponentStatus === "disconnected" && (
          <div className="w-full p-2 flex items-center justify-center">
            <span className="font-medium text-center">
              Your opponent is disconnected. You will automatically win in{" "}
              <span className="tabular-nums">{disconnectSecondsRemaining}</span>{" "}
              seconds.
            </span>
          </div>
        )}
        <div className="w-full py-4 grid grid-cols-3 border-b bg-background/50 px-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {statusMap[status].element}
              <span className="font-medium">{statusMap[status].label}</span>
            </div>
            <Separator orientation="vertical" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {match.users.map((user) => {
                  const hasSubmission = match.submissions.find(
                    (submission) => submission.userId === user.userId,
                  );

                  return (
                    <div
                      key={user.userId}
                      className={cn(
                        "size-4 rounded-full shrink-0 bg-muted-foreground",
                        hasSubmission && "bg-accent",
                      )}
                    />
                  );
                })}
              </div>
              <span className="text-muted-foreground">
                Submissions:{" "}
                <span className="text-foreground font-medium">
                  {match.submissions.length}/{match.users.length}
                </span>
              </span>
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
            <Button
              variant="destructive"
              disabled={isEnding || opponentStatus === "disconnected"}
              onClick={handleMatchQuit}
            >
              <LoadingSwap isLoading={isEnding}>Quit</LoadingSwap>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
