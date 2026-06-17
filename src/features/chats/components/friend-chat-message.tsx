"use client";

import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { UserAvatar } from "@/components/user-avatar";
import { ChatMessageTable } from "@/db/schema";
import { formatDate } from "@/features/oracle/lib/formatters";
import { useConfirm } from "@/hooks/use-confirm";
import { User } from "@/lib/auth/auth";
import { cn } from "@/lib/utils";
import { EditIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteFriendChatMessageAction } from "../actions/actions";
import { useFriendChatSocket } from "../hooks/use-friend-chat-socket";
import { formatChatMessageStatus } from "../lib/formatters";
import { FriendChatMessageInput } from "./friend-chat-message-input";

export const FriendChatMessage = ({
  chatMessage,
  currentUserId,
}: {
  chatMessage: typeof ChatMessageTable.$inferSelect & { user: User };
  currentUserId: string;
}) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure you want to delete this chat message?",
  );
  const { broadcastMessageDeleted } = useFriendChatSocket();
  const isCurrentUser = chatMessage.userId === currentUserId;

  const handleChatMessageDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return null;

    startTransition(async () => {
      const response = await deleteFriendChatMessageAction(
        chatMessage.chatId,
        chatMessage.id,
      );
      if (response.error || !response.chatMessage) {
        toast.error(response.message);
      } else {
        broadcastMessageDeleted(response.chatMessage.id);
        toast.success(response.message);
        router.refresh();
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <div
        className={cn(
          "flex gap-2 items-start rounded-md p-2 w-full min-w-0",
          isCurrentUser && "bg-muted/50",
        )}
      >
        <UserAvatar {...chatMessage.user} />

        <div className="flex items-start gap-2 w-full min-w-0 flex-1">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {isCurrentUser ? "You" : chatMessage.user.name}
              </span>
              <span className="text-muted-foreground text-semibold">•</span>
              <span className="text-base font-medium text-muted-foreground">
                {formatDate(chatMessage.respondedAt ?? chatMessage.createdAt)}{" "}
                {chatMessage.status !== "created" && (
                  <span className="italic">
                    ({formatChatMessageStatus(chatMessage.status)})
                  </span>
                )}
              </span>
            </div>
            {isUpdating ? (
              <FriendChatMessageInput
                chatId={chatMessage.chatId}
                setIsUpdating={setIsUpdating}
                existingChatMessage={chatMessage}
              />
            ) : (
              <MarkdownRenderer
                variant="default"
                className={cn(
                  chatMessage.status === "deleted" &&
                    "[&_p]:text-muted-foreground",
                )}
              >
                {chatMessage.status === "deleted"
                  ? "*This message was deleted.*"
                  : chatMessage.text}
              </MarkdownRenderer>
            )}
          </div>
          {isCurrentUser && chatMessage.status !== "deleted" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsUpdating(true)}
                disabled={isPending}
              >
                <EditIcon />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleChatMessageDeletion}
              >
                <LoadingSwap isLoading={isPending}>
                  <Trash2Icon />
                </LoadingSwap>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
