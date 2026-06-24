"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Separator } from "@/components/ui/separator";
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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  handleMatchTimeoutAction,
  handleUserMatchWinAction,
  quitMatchAction,
} from "../actions/actions";
import { useMatchSocket } from "../hooks/use-match-socket";
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
  const expiresAtMs = match.expiresAt?.getTime() ?? null;
  const [now, setNow] = useState(() => Date.now());
  const secondsRemaining =
    expiresAtMs === null
      ? null
      : Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
  const [disconnectSecondsRemaining, setDisconnectSecondsRemaining] =
    useState(30);
  const {
    connect,
    connectToMatch,
    disconnectFromMatch,
    status,
    opponentStatus,
    lastEvent,
    subscribeMatchEvent,
  } = useMatchSocket();
  const [confirmationDialog, confirm] = useConfirm(
    "Confirm Leave",
    "Are you sure you want to quit this match?",
  );
  const isMatchFinished =
    lastEvent?.type === "match_finished" ||
    !!(match.result && match.status === "finished");
  const hasSubmittedCode = match.submissions.length > 0;

  const handleMatchQuit = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    setIsEnding(true);

    const response = await quitMatchAction(match.id);
    if (response.error) {
      toast.error(response.message);
      setIsEnding(false);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  };

  const handleMatchTimeout = useCallback(async () => {
    setIsEnding(true);

    const response = await handleMatchTimeoutAction(match.id);
    if (response.error) {
      toast.error(response.message);
      setIsEnding(false);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  }, [match.id, router, setIsEnding]);

  const handleUserMatchWin = useCallback(async () => {
    setIsEnding(true);

    const response = await handleUserMatchWinAction(match.id);
    if (response.error) {
      toast.error(response.message);
      setIsEnding(false);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  }, [match.id, router, setIsEnding]);

  useEffect(() => {
    const shouldConnect =
      status !== "connecting" && status !== "open" && !isMatchFinished;

    if (!shouldConnect) return;

    void connect();
  }, [connect, status, isMatchFinished]);

  useEffect(() => {
    const shouldConnectToMatch = status === "open" && !isMatchFinished;

    if (!shouldConnectToMatch) return;

    connectToMatch(match.id);

    return () => {
      disconnectFromMatch(match.id);
    };
  }, [connectToMatch, disconnectFromMatch, match.id, status, isMatchFinished]);

  useEffect(() => {
    if (isMatchFinished || secondsRemaining === null) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, isMatchFinished]);

  useEffect(() => {
    if (
      isMatchFinished ||
      secondsRemaining === null ||
      secondsRemaining > 0 ||
      match.status !== "in-progress"
    )
      return;

    void handleMatchTimeout();
  }, [handleMatchTimeout, isMatchFinished, match.status, secondsRemaining]);

  useEffect(() => {
    if (isMatchFinished || match.kind === "friend_challenge") return;
    if (opponentStatus === "active" && match.status === "in-progress") {
      const timeout = setTimeout(() => setDisconnectSecondsRemaining(30), 0);
      return () => clearTimeout(timeout);
    }
    if (disconnectSecondsRemaining <= 0 && match.status === "in-progress") {
      void handleUserMatchWin();
      return;
    }
    const interval = setInterval(() => {
      if (disconnectSecondsRemaining <= 0 && match.status === "in-progress") {
        void handleUserMatchWin();
        return;
      }
      setDisconnectSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [
    opponentStatus,
    disconnectSecondsRemaining,
    match.status,
    match.kind,
    isMatchFinished,
    handleUserMatchWin,
  ]);

  useEffect(() => {
    if (isMatchFinished) return;
    const unsubscribers = [
      subscribeMatchEvent("opponent_submitted_code", () => {
        if (!hasSubmittedCode) {
          toast.success("Your opponent has submitted their code.");
          router.refresh();
        }
      }),
      subscribeMatchEvent("error", (event) => {
        toast.error(event.message ?? "Something went wrong behind the scenes.");
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [subscribeMatchEvent, isMatchFinished, hasSubmittedCode, router]);

  const timeValues =
    secondsRemaining === null ? null : getTimeValues(secondsRemaining);

  const handleLeaveMatch = async () => {
    setIsEnding(true);
    await new Promise((resolve) => {
      disconnectFromMatch(match.id);
      setTimeout(() => {
        resolve("Success");
      }, 2000);
    });
    setIsEnding(false);
    router.push("/matches");
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
        {opponentStatus === "disconnected" && match.kind === "arena" && (
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
                  secondsRemaining !== null &&
                    secondsRemaining <= 10 &&
                    "text-destructive",
                )}
              >
                {timeValues
                  ? `${timeValues.hours.toString().padStart(2, "0")}:${timeValues.minutes
                      .toString()
                      .padStart(2, "0")}:${timeValues.seconds
                      .toString()
                      .padStart(2, "0")}`
                  : "No time limit"}
              </span>
            </div>
          </div>

          <div className="flex justify-end items-center gap-2">
            <Button
              variant="outline"
              disabled={isEnding}
              onClick={handleLeaveMatch}
            >
              Back to matches
            </Button>
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
