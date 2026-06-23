"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { useConfirm } from "@/hooks/use-confirm";
import { usePendingActionStore } from "@/store/use-pending-action-store";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { acceptMatchRequestAction } from "../actions/actions";

export const AcceptMatchRequestButton = ({
  matchRequestId,
  children,
  onClick,
  disabled,
  className,
  ...props
}: {
  matchRequestId: string;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { notifyFriendMatchRequestAction } = useNotificationsSocket();
  const {
    isPending: otherActionsPending,
    setIsPending: setOtherActionsPending,
  } = usePendingActionStore();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Decision",
    "Are you sure you want to accept this match request?",
  );

  const handleAcceptMatchRequest = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    setOtherActionsPending(true);

    startTransition(async () => {
      const response = await acceptMatchRequestAction(matchRequestId);
      if (
        response.error ||
        !response.matchId ||
        !response.matchRequestId ||
        !response.notificationId
      ) {
        toast.error(response.message);
      } else {
        notifyFriendMatchRequestAction(response.notificationId, "accepted");
        toast.success(response.message);
        router.push(`/arena/matches/${response.matchId}`);
      }
    });

    setOtherActionsPending(false);
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        disabled={isPending || otherActionsPending || disabled}
        onClick={handleAcceptMatchRequest}
        {...props}
      >
        <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
