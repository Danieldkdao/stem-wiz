"use client";

import { MatchChatMessage } from "../hooks/use-match-chat-messages";
import { UserAvatar } from "@/components/user-avatar";
import { MessageSquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useEffect, useRef } from "react";

export const MatchChatMessageList = ({
  messages,
}: {
  messages: MatchChatMessage[];
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useAuthSession();

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      behavior: "smooth",
      top: container.scrollHeight,
    });
  }, [messages]);

  return (
    <div
      ref={scrollContainerRef}
      className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-4"
    >
      {messages.length ? (
        messages.map((message) => (
          <div
            className={cn(
              "rounded-md p-4 flex flex-col gap-2",
              session?.user.id === message.user.id && "bg-background",
            )}
            key={message.id}
          >
            <div className="flex items-start gap-2.5">
              <UserAvatar {...message.user} />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium">{message.user.name}</h2>
                  <span>•</span>
                  <span>{message.createdAt.toDateString()}</span>
                </div>

                <p className="text-muted-foreground text-base">
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="w-full h-full p-4 rounded-md border-2 border-dashed border-border flex justify-center items-center">
          <div className="flex flex-col gap-2 items-center">
            <MessageSquareIcon className="size-10" />
            <h1 className="text-lg font-semibold">No Chat Messages Yet</h1>
            <p className="text-base text-muted-foreground">
              Be the first to start the conversation!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
