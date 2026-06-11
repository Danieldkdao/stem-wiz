import { ChatTable } from "@/db/schema";
import { useEffect, useMemo, useState } from "react";
import { useFriendChatSocket } from "./use-friend-chat-socket";
import { User } from "@/lib/auth/auth";

export const useFriendChats = (
  initialChats: (typeof ChatTable.$inferSelect & {
    user: User;
    messageCount: number;
  })[],
) => {
  const [chats, setChats] = useState(initialChats);
  const { subscribeChatEvent } = useFriendChatSocket();

  const sortedChats = useMemo(() => {
    return chats.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [chats]);

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

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

  return sortedChats;
};
