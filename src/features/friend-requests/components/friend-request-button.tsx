"use client";

import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { UserCheckIcon, UserCircleIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { createFriendRequestAction } from "../actions/actions";
import { FriendRequestTable } from "@/db/schema";

export const FriendRequestButton = ({
  userId,
  existingFriendRequest,
}: {
  userId: string;
  existingFriendRequest?: typeof FriendRequestTable.$inferSelect;
}) => {
  const router = useRouter();
  const { notifyFriendRequestSent } = useNotificationsSocket();
  const [isPending, startTransition] = useTransition();

  const sendFriendRequest = async () => {
    if (existingFriendRequest) return;
    startTransition(async () => {
      const response = await createFriendRequestAction(userId);
      if (response.error || !response.notificationId) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        notifyFriendRequestSent(response.notificationId);
        router.refresh();
      }
    });
  };

  return (
    <TooltipWrapper
      content={
        existingFriendRequest
          ? existingFriendRequest.status === "pending"
            ? "Your friend request is pending"
            : existingFriendRequest.status === "accepted"
              ? "You are friends with this user."
              : "Add user to friends"
          : "Add user to friends"
      }
    >
      <Button
        variant="outline"
        size="icon"
        disabled={isPending}
        onClick={sendFriendRequest}
      >
        <LoadingSwap isLoading={isPending}>
          {/* todo: fix this up and make sure that depending on if the user is the recipient or the sender they will have different uis (popover w/ accept/reject options vs tooltip message) */}
          {existingFriendRequest ? (
            existingFriendRequest.status === "pending" ? (
              <UserCircleIcon />
            ) : existingFriendRequest.status === "accepted" ? (
              <UserCheckIcon className="text-emerald-500" />
            ) : (
              <UserPlusIcon />
            )
          ) : (
            <UserPlusIcon />
          )}
        </LoadingSwap>
      </Button>
    </TooltipWrapper>
  );
};
