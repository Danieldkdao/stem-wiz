import { ChatMessageTable } from "@/db/schema";
import { useMatchObserverSocket } from "@/features/matches/hooks/use-match-observer-socket";
import { useEffect, useMemo, useState } from "react";

export type MatchChatMessage = Omit<
  typeof ChatMessageTable.$inferSelect,
  "userId"
> & {
  user: { id: string; name: string; image?: string | null | undefined };
};

export const useMatchChatMessages = ({
  initialMessages,
}: {
  initialMessages?: MatchChatMessage[];
}) => {
  const { subscribeObserverEvent } = useMatchObserverSocket();
  const [liveMessages, setLiveMessages] = useState<MatchChatMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeObserverEvent("new_chat_message", (event) => {
      const newChatMessage: MatchChatMessage = {
        id: event.messageId,
        user: event.user,
        chatId: event.chatId,
        text: event.message,
        respondedAt: new Date(),
        status: "created",
        role: "user",
        createdAt: new Date(event.createdAt),
      };

      setLiveMessages((prev) => {
        if (prev.some((message) => message.id === newChatMessage.id)) {
          return prev;
        }

        return [...prev, newChatMessage];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeObserverEvent]);

  return useMemo(() => {
    const messagesById = new Map(
      (initialMessages ?? []).map((message) => [message.id, message]),
    );

    liveMessages.forEach((message) => {
      messagesById.set(message.id, message);
    });

    return Array.from(messagesById.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }, [initialMessages, liveMessages]);
};
