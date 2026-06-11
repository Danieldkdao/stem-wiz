"use client";

import { ChatMessageTable } from "@/db/schema";
import { FriendChatMessage } from "./friend-chat-message";
import { User } from "@/lib/auth/auth";
import { useFriendChatMessages } from "../hooks/use-friend-chat-messages";
import { useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { MessageSquareXIcon } from "lucide-react";

export const FriendChatMessageListClient = ({
  initialMessages,
  friendRequestId,
  userId,
}: {
  initialMessages: (typeof ChatMessageTable.$inferSelect & { user: User })[];
  friendRequestId: string;
  userId: string;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatMessages = useFriendChatMessages(initialMessages);

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
    </CardContent>
  );
};
