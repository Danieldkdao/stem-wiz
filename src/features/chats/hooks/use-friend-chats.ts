import { ChatTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { useEffect, useRef, useState, useTransition } from "react";
import { getFriendChatsAction } from "../actions/actions";
import { useFriendChatParams } from "./use-friend-chat-params";
import { useFriendChatSocket } from "./use-friend-chat-socket";

export const useFriendChats = (
  initialChats: (typeof ChatTable.$inferSelect & {
    user: User;
    messageCount: number;
  })[],
  initialHasNextPage: boolean,
) => {
  const [filters] = useFriendChatParams();
  const [chats, setChats] = useState(initialChats);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();
  const { subscribeChatEvent } = useFriendChatSocket();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChats(initialChats);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialChats, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getFriendChatsAction({
            ...filters,
            page: nextPage,
          });
          if (!response) return;

          const { chats, metadata } = response;

          setChats((prev) => [...prev, ...chats]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [filters, page, hasNextPage, isPending]);

  useEffect(() => {
    const unsubscribers = [
      subscribeChatEvent("new_chat", (event) => {
        const { createdAt, ...fields } = event.chat;
        const newChat = {
          ...fields,
          createdAt: new Date(createdAt),
        };

        setChats((prev) => [newChat, ...prev]);
      }),
      subscribeChatEvent("friend_chat_deleted", (event) => {
        setChats((prev) => prev.filter((chat) => chat.id !== event.chatId));
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [subscribeChatEvent]);

  return { chats, sentinelRef, isPending };
};
