"use client";

import { ChatMessageTable } from "@/db/schema";
import { useEffect, useState } from "react";
import { useFriendChatSocket } from "./use-friend-chat-socket";
import { User } from "@/lib/auth/auth";

export const useFriendChatMessages = (
  initialMessages?: (typeof ChatMessageTable.$inferSelect & { user: User })[],
) => {
  const [chatMessages, setChatMessages] = useState(initialMessages ?? []);
  const { subscribeEvent } = useFriendChatSocket();

  useEffect(() => {
    setChatMessages(initialMessages ?? []);
  }, [initialMessages]);

  useEffect(() => {
    const unsubscribers = [
      subscribeEvent("friend_message_sent", (event) => {
        const { createdAt, respondedAt, ...props } = event.message;
        const newMessage = {
          ...props,
          createdAt: new Date(createdAt),
          respondedAt: respondedAt ? new Date(respondedAt) : null,
        };
        setChatMessages((prev) => [...prev, newMessage]);
      }),
      subscribeEvent("friend_message_updated", (event) => {
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
      subscribeEvent("friend_message_deleted", (event) => {
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
  }, [subscribeEvent]);

  return chatMessages;
};
