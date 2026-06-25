"use client";

import { Button } from "@/components/ui/button";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { useConfirm } from "@/hooks/use-confirm";
import { usePendingActionStore } from "@/store/use-pending-action-store";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { acceptMatchObserverInvitationAction } from "../actions/actions";
import { toast } from "sonner";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const AcceptMatchObserverInvitationButton = ({
  matchObserverInvitationId,
  children,
  onClick,
  disabled,
  ...props
}: {
  matchObserverInvitationId: string;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Decision",
    "Are you sure you want to accept this invitation to watch the match?",
  );
  const router = useRouter();
  const { notifyMatchObserverInvitationAction } = useNotificationsSocket();
  const [isPending, startTransition] = useTransition();
  const {
    isPending: otherActionsPending,
    setIsPending: setOtherActionsPending,
  } = usePendingActionStore();

  const handleAcceptMatchObserverInvitation = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    setOtherActionsPending(true);

    startTransition(async () => {
      const response = await acceptMatchObserverInvitationAction(
        matchObserverInvitationId,
      );
      if (response.error || !response.matchId || !response.notificationId) {
        toast.error(response.message);
      } else {
        const notificationSent = notifyMatchObserverInvitationAction(
          response.notificationId,
          "accepted",
        );
        if (!notificationSent)
          toast.warning(
            "Match invitation accepted but failed to send realtime notification.",
          );
        toast.success(response.message);
        router.push(`/arena/matches/${response.matchId}/observing`);
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        onClick={handleAcceptMatchObserverInvitation}
        disabled={isPending || otherActionsPending || disabled}
        {...props}
      >
        <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
