"use client";

import { ChatMessageTable } from "@/db/schema";
import {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFriendChatSocket } from "./use-friend-chat-socket";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { getFriendChatMessagesAction } from "../actions/actions";

export const useFriendChatMessages = (
  initialMessages: (typeof ChatMessageTable.$inferSelect & { user: User })[],
  initialHasNextPage: boolean,
  chatId: string,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
) => {
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const initialMessagesKey = initialMessages
    .map((message) => message.id)
    .join(":");
  const resetKey = `${chatId}:${initialMessagesKey}:${initialHasNextPage}`;
  const [currentResetKey, setCurrentResetKey] = useState(resetKey);
  const [isPending, startTransition] = useTransition();
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const isLoadingOlderMessagesRef = useRef(false);
  const pendingScrollRestoreRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const { subscribeChatEvent } = useFriendChatSocket();

  if (currentResetKey !== resetKey) {
    setCurrentResetKey(resetKey);
    setChatMessages(initialMessages);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }

  const loadOlderMessages = useCallback(() => {
    if (!hasNextPage || isLoadingOlderMessagesRef.current) return;

    isLoadingOlderMessagesRef.current = true;
    setIsLoadingOlderMessages(true);

    startTransition(async () => {
      try {
        const nextPage = page + 1;
        const scrollContainer = scrollContainerRef.current;

        if (scrollContainer) {
          pendingScrollRestoreRef.current = {
            scrollHeight: scrollContainer.scrollHeight,
            scrollTop: scrollContainer.scrollTop,
          };
        }

        const response = await getFriendChatMessagesAction(chatId, nextPage);
        if (!response) return;

        const { chatMessages, metadata } = response;

        setChatMessages((prev) => {
          const existingMessageIds = new Set(prev.map((message) => message.id));
          const olderMessages = chatMessages.filter(
            (message) => !existingMessageIds.has(message.id),
          );

          return [...olderMessages, ...prev];
        });
        setPage(nextPage);
        setHasNextPage(metadata.hasNextPage);

        requestAnimationFrame(() => {
          const scrollContainer = scrollContainerRef.current;
          const pendingScrollRestore = pendingScrollRestoreRef.current;
          if (!scrollContainer || !pendingScrollRestore) return;

          scrollContainer.scrollTop =
            scrollContainer.scrollHeight -
            pendingScrollRestore.scrollHeight +
            pendingScrollRestore.scrollTop;
          pendingScrollRestoreRef.current = null;
        });
      } finally {
        isLoadingOlderMessagesRef.current = false;
        setIsLoadingOlderMessages(false);
      }
    });
  }, [chatId, hasNextPage, page, scrollContainerRef]);

  useEffect(() => {
    const unsubscribers = [
      subscribeChatEvent("friend_message_sent", (event) => {
        const { createdAt, respondedAt, ...props } = event.message;
        const newMessage = {
          ...props,
          createdAt: new Date(createdAt),
          respondedAt: respondedAt ? new Date(respondedAt) : null,
        };
        setChatMessages((prev) => {
          if (prev.some((message) => message.id === newMessage.id)) {
            return prev;
          }

          return [...prev, newMessage];
        });
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

  return {
    chatMessages,
    hasNextPage,
    isPending: isPending || isLoadingOlderMessages,
    loadOlderMessages,
  };
};
