"use client";

import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { updateMatchObserverInvitationStatusAction } from "../actions/actions";
import { MatchObserverInvitationStatusType } from "@/db/shared";
import { toast } from "sonner";
import { usePendingActionStore } from "@/store/use-pending-action-store";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";

type LimitedMatchObserverInvitationStatus = Extract<
  MatchObserverInvitationStatusType,
  "rejected" | "revoked"
>;

const confirmTextMap: Record<
  LimitedMatchObserverInvitationStatus,
  { title: string; description: string }
> = {
  rejected: {
    title: "Confirm Rejection",
    description:
      "Are you sure you want to turn down the opportunity to watch this match?",
  },
  revoked: {
    title: "Confirm Decision",
    description:
      "Are you sure you want to revoke this user's invitation to watch this match?",
  },
};

export const UpdateMatchObserverInvitationStatusButton = ({
  matchObserverInvitationId,
  newStatus,
  children,
  onClick,
  disabled,
  ...props
}: {
  matchObserverInvitationId: string;
  newStatus: LimitedMatchObserverInvitationStatus;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const confirmText = confirmTextMap[newStatus];
  const [ConfirmationDialog, confirm] = useConfirm(
    confirmText.title,
    confirmText.description,
  );
  const { notifyMatchObserverInvitationAction } = useNotificationsSocket();
  const {
    isPending: otherActionsPending,
    setIsPending: setOtherActionsPending,
  } = usePendingActionStore();

  const handleUpdateMatchObserverInvitationStatus = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    setOtherActionsPending(true);

    startTransition(async () => {
      const response = await updateMatchObserverInvitationStatusAction(
        matchObserverInvitationId,
        newStatus,
      );
      if (response.error || !response.notificationId) {
        toast.error(response.message);
      } else {
        const notificationSent = notifyMatchObserverInvitationAction(
          response.notificationId,
          newStatus,
        );
        if (!notificationSent)
          toast.warning(
            "Unable to send realtime notification but update successful.",
          );
        toast.success(response.message);
        router.refresh();
      }
    });

    setOtherActionsPending(false);
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        onClick={handleUpdateMatchObserverInvitationStatus}
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
