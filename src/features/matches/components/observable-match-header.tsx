"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  ArenaProblemTable,
  ChatMessageTable,
  ChatTable,
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
  UserMatchTable,
} from "@/db/schema";
import { statusMap } from "@/features/arena/components";
import { useMatchChatMessages } from "@/features/chats/hooks/use-match-chat-messages";
import { User } from "@/lib/auth/auth";
import { cn, getTimeValues } from "@/lib/utils";
import {
  EyeIcon,
  LogOutIcon,
  PanelRightOpenIcon,
  TimerIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useMatchObserverSocket } from "../hooks/use-match-observer-socket";
import { MatchFinishedDialog } from "./match-finished-dialog";
import { ObserverMatchSliderContent } from "./observer-match-slider-content";

type ObservableMatchHeaderProps = {
  match: typeof MatchTable.$inferSelect & {
    submissions: (typeof MatchSubmissionTable.$inferSelect)[];
    users: (typeof UserMatchTable.$inferSelect & { user: User })[];
    result?: typeof MatchResultTable.$inferSelect | null;
    arenaProblem: typeof ArenaProblemTable.$inferSelect;
    chats: (typeof ChatTable.$inferSelect & {
      messages: (typeof ChatMessageTable.$inferSelect & { user: User })[];
    })[];
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
    subscribeObserverEvent,
    matchObserverCount,
    matchCompletionReason,
    leaveObserverMatch,
    lastEvent,
  } = useMatchObserverSocket();
  const expiresAtMs = match.expiresAt.getTime();
  const [now, setNow] = useState(() => Date.now());
  const initialChatMessages = match.chats?.[0]?.messages ?? [];
  const chatMessages = useMatchChatMessages({
    initialMessages: initialChatMessages,
  });
  const [isPending, startTransition] = useTransition();

  const secondsRemaining = Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
  const isMatchFinished =
    lastEvent?.type === "match_finished" ||
    !!(match.result && match.status === "finished");

  useEffect(() => {
    if (status === "connecting" || status === "open" || isMatchFinished) return;

    connect();
  }, [connect, isMatchFinished, status]);

  useEffect(() => {
    if (status !== "open" || isMatchFinished) return;

    subscribeObserverMatch(match.id);
  }, [isMatchFinished, match.id, status, subscribeObserverMatch]);

  useEffect(() => {
    if (isMatchFinished) return;
    const unsubscribers = [
      subscribeObserverEvent("user_submitted_code", (event) => {
        const user = match.users.find((user) => user.userId === event.userId);
        toast.success(`${user?.user.name || "User"} has submitted their code.`);
        router.refresh();
      }),
      subscribeObserverEvent("connection_error", (event) => {
        toast.error(event.message ?? "Connection Error");
      }),
      subscribeObserverEvent("error", (event) => {
        toast.error(event.message ?? "Something went wrong behind the scenes.");
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [isMatchFinished, match.users, subscribeObserverEvent, router]);

  useEffect(() => {
    if (isMatchFinished) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isMatchFinished]);

  const handleLeaveMatch = async () => {
    startTransition(async () => {
      leaveObserverMatch(match.id);

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve("Success!");
        }, 1500);
      });
      router.push("/arena/observe");
    });
  };

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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelRightOpenIcon />
              </Button>
            </SheetTrigger>
            <ObserverMatchSliderContent
              match={match}
              chatMessages={chatMessages}
            />
          </Sheet>
          <Separator orientation="vertical" />
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
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleLeaveMatch}
          >
            <LoadingSwap isLoading={isPending}>
              <div className="flex items-center gap-2">
                Leave
                <LogOutIcon />
              </div>
            </LoadingSwap>
          </Button>
        </div>
      </div>
    </>
  );
};
