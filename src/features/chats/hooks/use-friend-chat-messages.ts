"use client";

import { ChatMessageTable } from "@/db/schema";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFriendChatSocket } from "./use-friend-chat-socket";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { getFriendChatMessagesAction } from "../actions/actions";

export const useFriendChatMessages = (
  initialMessages: (typeof ChatMessageTable.$inferSelect & { user: User })[],
  initialHasNextPage: boolean,
  chatId: string,
  friendRequestId: string,
) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [isPending, startTransition] = useTransition();
  const { subscribeChatEvent } = useFriendChatSocket();

  useEffect(() => {
    setChatMessages(initialMessages);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialMessages, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getFriendChatMessagesAction(
            chatId,
            friendRequestId,
            nextPage,
          );
          if (!response) return;

          const { chatMessages, metadata } = response;

          setChatMessages((prev) => [...prev, ...chatMessages]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [page, hasNextPage, isPending, chatId, friendRequestId]);

  useEffect(() => {
    const unsubscribers = [
      subscribeChatEvent("friend_message_sent", (event) => {
        const { createdAt, respondedAt, ...props } = event.message;
        const newMessage = {
          ...props,
          createdAt: new Date(createdAt),
          respondedAt: respondedAt ? new Date(respondedAt) : null,
        };
        setChatMessages((prev) => [...prev, newMessage]);
      }),
      subscribeChatEvent("friend_message_updated", (event) => {
        setChatMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === event.message.id) {
              const { text, respondedAt, status } = event.message;
              return {
                ...msg,
                text,
                respondedAt: respondedAt ? new Date(respondedAt) : new Date(),
                status,
              };
            }
            return msg;
          }),
        );
      }),
      subscribeChatEvent("friend_message_deleted", (event) => {
        setChatMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === event.message.id) {
              const { respondedAt, status } = event.message;
              return {
                ...msg,
                respondedAt: respondedAt ? new Date(respondedAt) : new Date(),
                status,
              };
            }
            return msg;
          }),
        );
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [subscribeChatEvent]);

  return { chatMessages, sentinelRef, isPending };
};
