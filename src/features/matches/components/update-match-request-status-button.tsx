"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { FriendMatchRequestStatusType } from "@/db/shared";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { useConfirm } from "@/hooks/use-confirm";
import { usePendingActionStore } from "@/store/use-pending-action-store";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { updateMatchRequestStatusAction } from "../actions/actions";

type LimitedMatchRequestStatus = Extract<
  FriendMatchRequestStatusType,
  "cancelled" | "rejected"
>;

const statusConfirmationTextMap: Record<
  LimitedMatchRequestStatus,
  {
    title: string;
    description: string;
  }
> = {
  cancelled: {
    title: "Confirm Cancellation",
    description:
      "Are you sure you want to cancel this match request? This action cannot be undone.",
  },
  rejected: {
    title: "Confirm Rejection",
    description: "Are you sure that you want to reject this match request?",
  },
};

export const UpdateMatchRequestStatusButton = ({
  matchRequestId,
  newStatus,
  children,
  afterAction,
  onClick,
  disabled,
  ...props
}: {
  matchRequestId: string;
  newStatus: LimitedMatchRequestStatus;
  children: ReactNode;
  afterAction?: () => void;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const { notifyFriendMatchRequestAction } = useNotificationsSocket();
  const [isPending, startTransition] = useTransition();
  const {
    isPending: otherActionsPending,
    setIsPending: setOtherActionsPending,
  } = usePendingActionStore();
  const confirmationText = statusConfirmationTextMap[newStatus];
  const [ConfirmationDialog, confirm] = useConfirm(
    confirmationText.title,
    confirmationText.description,
  );

  const handleMatchRequestStatusUpdate = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    setOtherActionsPending(true);

    startTransition(async () => {
      const response = await updateMatchRequestStatusAction(
        matchRequestId,
        newStatus,
      );
      if (
        response.error ||
        !response.matchRequestId ||
        !response.notificationId
      ) {
        toast.error(response.message);
      } else {
        notifyFriendMatchRequestAction(response.notificationId, newStatus);
        toast.success(response.message);
        router.refresh();
        afterAction?.();
      }
    });

    setOtherActionsPending(false);
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        disabled={isPending || otherActionsPending || disabled}
        onClick={handleMatchRequestStatusUpdate}
        {...props}
      >
        <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
