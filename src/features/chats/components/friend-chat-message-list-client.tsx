"use client";

import { ChatMessageTable } from "@/db/schema";
import { FriendChatMessage } from "./friend-chat-message";
import { User } from "@/lib/auth/auth";
import { useFriendChatMessages } from "../hooks/use-friend-chat-messages";
import { useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { Loader2Icon, MessageSquareXIcon } from "lucide-react";

export const FriendChatMessageListClient = ({
  initialMessages,
  initialHasNextPage,
  chatId,
  friendRequestId,
  userId,
}: {
  initialMessages: (typeof ChatMessageTable.$inferSelect & { user: User })[];
  initialHasNextPage: boolean;
  chatId: string;
  friendRequestId: string;
  userId: string;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { chatMessages, sentinelRef, isPending } = useFriendChatMessages(
    initialMessages,
    initialHasNextPage,
    chatId,
    friendRequestId,
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      behavior: "smooth",
      top: container.scrollHeight,
    });
  }, [chatMessages]);

  return (
    <CardContent
      ref={scrollContainerRef}
      className="w-full h-full flex-1 overflow-y-auto min-h-0"
    >
      <div className="flex flex-col gap-1 w-full h-full">
        {chatMessages.length ? (
          chatMessages.map((msg) => (
            <FriendChatMessage
              key={msg.id}
              chatMessage={msg}
              friendRequestId={friendRequestId}
              currentUserId={userId}
            />
          ))
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <MessageSquareXIcon className="size-10" />
            <h2 className="text-2xl font-semibold text-center">
              No messages yet
            </h2>
            <p className="text-muted-foreground text-lg max-w-125 text-center">
              Looks like no messages have been sent yet. Once a message is sent
              it will appear here.
            </p>
          </div>
        )}
      </div>
      <div ref={sentinelRef} className="h-1 w-full bg-transparent" />
      {isPending && (
        <div className="flex items-center justify-center">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
    </CardContent>
  );
};
