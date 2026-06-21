"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { ComponentProps, useTransition } from "react";
import { deleteCommunityProblemAction } from "../actions/actions";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";

export const DeleteCommunityProblemButton = ({
  communityProblemId,
  children,
  onClick,
  disabled,
  ...props
}: { communityProblemId: string } & ComponentProps<typeof Button>) => {
  const pathname = usePathname();
  const router = useRouter();
  const { notifyFriendsCommunityProblemDeletion } = useNotificationsSocket();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure you want to delete this problem? The problem will be permanently removed and all friends you have shared it with will lose access.",
  );

  const handleDeleteCommunityProblem = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteCommunityProblemAction(communityProblemId);
      if (response.error || !response.notificationIds) {
        toast.error(response.message);
      } else {
        notifyFriendsCommunityProblemDeletion(response.notificationIds);
        toast.success(response.message);
        if (pathname === "/community/problems") router.refresh();
        else router.push("/community/problems");
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        disabled={isPending || disabled}
        onClick={handleDeleteCommunityProblem}
        {...props}
      >
        <LoadingSwap isLoading={isPending}>{children}</LoadingSwap>
      </Button>
    </>
  );
};
