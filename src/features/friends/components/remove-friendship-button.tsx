"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { usePendingActionStore } from "@/store/use-pending-action-store";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { removeFriendAction } from "../actions/actions";
import { toast } from "sonner";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const RemovedFriendshipButton = ({
  friendshipId,
  children,
  onClick,
  disabled,
  ...props
}: {
  friendshipId: string;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { notifyFriendshipRemoved } = useNotificationsSocket();
  const {
    isPending: otherActionsPending,
    setIsPending: setOtherActionsPending,
  } = usePendingActionStore();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Removal",
    "Are you sure you want to remove your connection with this user? This action cannot be undone and all data associated with this friendship (matches, requests, chats, etc.) will be permanently deleted.",
  );

  const handleFriendshipDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    setOtherActionsPending(true);

    startTransition(async () => {
      const response = await removeFriendAction(friendshipId);
      if (response.error || !response.notificationId) {
        toast.error(response.message);
      } else {
        const notificationSent = notifyFriendshipRemoved(
          response.notificationId,
        );
        if (!notificationSent)
          toast.warning(
            "Friendship removed successfully but failed to send real-time notification.",
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
        onClick={handleFriendshipDeletion}
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
