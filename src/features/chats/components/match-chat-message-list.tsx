"use client";

import { UserAvatar } from "@/components/user-avatar";
import { useAuthSession } from "@/hooks/use-auth-session";
import { cn } from "@/lib/utils";
import { Loader2Icon, MessageSquareIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMatchChatMessages } from "../hooks/use-match-chat-messages";

export const MatchChatMessageList = () => {
  const {
    chatMessages,
    scrollContainerRef,
    hasNextPage,
    isPending,
    loadOlderMessages,
  } = useMatchChatMessages();
  const { data: session } = useAuthSession();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPending) return;
    const container = scrollContainerRef?.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages.length, scrollContainerRef]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!sentinel || !scrollContainer || !hasNextPage || isPending) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        loadOlderMessages();
      },
      { root: scrollContainer, rootMargin: "400px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, isPending, loadOlderMessages, scrollContainerRef]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4"
    >
      <div ref={sentinelRef} className="h-1 w-full shrink-0 bg-transparent" />
      {isPending && (
        <div className="flex shrink-0 items-center justify-center">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
      {chatMessages.length ? (
        chatMessages.map((message) => (
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
