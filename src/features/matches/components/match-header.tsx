"use client";

import { TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { quitMatchAction } from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const MatchHeader = ({ matchId }: { matchId: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Leave",
    "Are you sure you want to quit this match?",
  );

  const handleMatchQuit = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await quitMatchAction(matchId);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        router.push("/dashboard");
      }
    });
  };

  return (
    <>
      <ConfirmationDialog />
      <div className="w-full py-4 grid grid-cols-3 border-b bg-background/50 px-5">
        <div />
        <div className="w-full flex items-center justify-center">
          <div className="flex items-center gap-2">
            <TimerIcon className="text-muted-foreground" />
            <span className="tabular-nums font-semibold text-lg">00:30:00</span>
          </div>
        </div>

        <div className="flex justify-end items-center">
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleMatchQuit}
          >
            <LoadingSwap isLoading={isPending}>Quit</LoadingSwap>
          </Button>
        </div>
      </div>
    </>
  );
};
