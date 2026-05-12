"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { MatchTable } from "@/db/schema";
import { useConfirm } from "@/hooks/use-confirm";
import { cn, getTimeValues } from "@/lib/utils";
import { TimerIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { handleMatchTimeoutAction, quitMatchAction } from "../actions/actions";
import { useMatchStore } from "@/store/use-match-store";

export const MatchHeader = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect;
}) => {
  const isEnding = useMatchStore((state) => state.isEnding);
  const setIsEnding = useMatchStore((state) => state.setIsEnding);
  const router = useRouter();
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.max(0, Math.ceil((match.expiresAt.getTime() - Date.now()) / 1000)),
  );
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Leave",
    "Are you sure you want to quit this match?",
  );

  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleMatchTimeout();
      return;
    }
    const interval = setInterval(async () => {
      if (secondsRemaining <= 0) {
        await handleMatchTimeout();
        return;
      }
      console.log(secondsRemaining);
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const timeValues = getTimeValues(secondsRemaining);

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

  const handleMatchTimeout = async () => {
    setIsEnding(true);
    const response = await handleMatchTimeoutAction(match.id);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  };

  return (
    <>
      <ConfirmationDialog />
      <div className="w-full py-4 grid grid-cols-3 border-b bg-background/50 px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>5 people watching</span>
          </div>
          <div>
            <span className="text-muted-foreground">
              Status:{" "}
              <span className="text-foreground font-medium">Connected</span>
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
            disabled={isEnding}
            onClick={handleMatchQuit}
          >
            <LoadingSwap isLoading={isEnding}>Quit</LoadingSwap>
          </Button>
        </div>
      </div>
    </>
  );
};
