"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { createFriendRequestAction } from "../actions/actions";

export const FriendRequestButton = ({
  userId,
  children,
  disabled,
  onClick,
  ...props
}: {
  userId: string;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const { notifyFriendRequestSent } = useNotificationsSocket();
  const [isPending, startTransition] = useTransition();

  const sendFriendRequest = async () => {
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
    <Button
      variant="outline"
      disabled={isPending || disabled}
      onClick={sendFriendRequest}
      {...props}
    >
      <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
        {children}
      </LoadingSwap>
    </Button>
  );
};
