"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { ComponentProps, ReactNode, useTransition } from "react";
import { deleteFriendChatAction } from "../actions/actions";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useFriendChatSocket } from "../hooks/use-friend-chat-socket";

export const DeleteFriendChatButton = ({
  chatId,
  children,
  onClick,
  disabled,
  ...props
}: {
  chatId: string;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { broadcastChatDeleted } = useFriendChatSocket();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure you want to delete this chat? This action cannot be undone and all data associated with this chat will be removed permanently.",
  );

  const deleteChat = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteFriendChatAction(chatId);
      if (response.error || !response.chat) {
        toast.error(response.message);
      } else {
        broadcastChatDeleted(response.chat.id);
        toast.success(response.message);
        if (pathname && pathname === "/community/chats") router.refresh();
        else router.push("/community/chats");
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button disabled={isPending || disabled} onClick={deleteChat} {...props}>
        <LoadingSwap isLoading={isPending}>{children}</LoadingSwap>
      </Button>
    </>
  );
};
