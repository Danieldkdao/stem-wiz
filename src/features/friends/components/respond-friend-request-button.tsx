"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { InvitationStatusType } from "@/db/shared";
import { useConfirm } from "@/hooks/use-confirm";
import { usePendingActionStore } from "@/store/use-pending-action-store";
import { ComponentProps, ReactNode } from "react";
import { respondFriendRequestAction } from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";

export const RespondFriendRequestButton = ({
  friendRequestId,
  action,
  children,
  onClick,
  disabled,
  ...props
}: {
  friendRequestId: string;
  action: Exclude<InvitationStatusType, "pending">;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const { isPending, setIsPending } = usePendingActionStore();
  const { notifyFriendRequestResponse } = useNotificationsSocket();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Decision",
    `Are you sure you want to ${action.slice(0, action.length - 2)} this friend request?`,
  );

  const respondToFriendRequest = async () => {
    if (isPending) return;
    const confirmation = await confirm();
    if (!confirmation) return;

    setIsPending(true);

    const response = await respondFriendRequestAction(friendRequestId, action);
    if (response.error || !response.notificationIds) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      notifyFriendRequestResponse(response.notificationIds.inserted, action);
      router.refresh();
    }

    setIsPending(false);
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        disabled={isPending || disabled}
        onClick={respondToFriendRequest}
        {...props}
      >
        <LoadingSwap isLoading={isPending}>{children}</LoadingSwap>
      </Button>
    </>
  );
};
