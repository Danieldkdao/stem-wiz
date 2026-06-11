"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { ChatTable, FriendRequestTable } from "@/db/schema";
import { statusMap } from "@/features/arena/components";
import { User } from "@/lib/auth/auth";
import { EditIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useFriendChatSocket } from "../hooks/use-friend-chat-socket";
import { Badge } from "@/components/ui/badge";
import { CreateUpdateFriendChatDialog } from "./create-update-chat-dialog";
import { DeleteFriendChatButton } from "./delete-friend-chat-button";
import { useRouter } from "next/navigation";

export const FriendChatHeader = ({
  chat,
  friendRequest,
}: {
  chat: typeof ChatTable.$inferSelect;
  friendRequest: typeof FriendRequestTable.$inferSelect & { user: User };
}) => {
  const router = useRouter();
  const {
    connect,
    status,
    subscribeChatEvent,
    connectToChat,
    disconnectFromChat,
    friendsConnectionStatuses,
  } = useFriendChatSocket();

  const isFriendConnected =
    friendsConnectionStatuses.get(chat.id)?.has(friendRequest.user.id) ?? false;

  useEffect(() => {
    if (status === "open" || status === "connecting") return;

    connect();
  }, [status]);

  useEffect(() => {
    if (status !== "open") return;

    connectToChat(chat.id);

    return () => {
      disconnectFromChat(chat.id);
    };
  }, [chat.id, status, connectToChat, disconnectFromChat]);

  useEffect(() => {
    const unsubscribers = [
      subscribeChatEvent("connection_error", ({ message }) => {
        toast.error(message);
      }),
      subscribeChatEvent("error", ({ message }) => {
        toast.error(message);
      }),
      subscribeChatEvent("friend_chat_updated", ({ message }) => {
        toast.info(message);
        router.refresh();
      }),
      subscribeChatEvent("friend_chat_deleted", ({ message }) => {
        toast.info(message);
        router.push("/community/chats");
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [subscribeChatEvent]);

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
        <div className="flex items-center gap-2">
          <UserAvatar {...friendRequest.user} />
          <span className="text-lg font-semibold">
            {friendRequest.user.name}
          </span>
          <Badge variant={isFriendConnected ? "default" : "outline"}>
            {isFriendConnected ? "Active" : "Offline"}
          </Badge>
        </div>
        <Separator orientation="vertical" />
        <div className="flex items-center gap-2">
          {statusMap[status].element}
          <span className="text-base font-medium">
            {statusMap[status].label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CreateUpdateFriendChatDialog existingChat={chat}>
          <Button variant="outline" size="icon">
            <EditIcon />
          </Button>
        </CreateUpdateFriendChatDialog>
        <DeleteFriendChatButton
          variant="destructive"
          chatId={chat.id}
          size="icon"
        >
          <Trash2Icon />
        </DeleteFriendChatButton>
      </div>
    </div>
  );
};
