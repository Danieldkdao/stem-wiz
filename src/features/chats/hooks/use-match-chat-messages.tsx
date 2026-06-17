import { ChatMessageTable } from "@/db/schema";
import { useMatchObserverSocket } from "@/features/matches/hooks/use-match-observer-socket";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { changeObjectValues } from "@/lib/utils";
import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { getMatchChatMessagesAction } from "../actions/actions";

type MatchChatMessage = typeof ChatMessageTable.$inferSelect & {
  user: User;
};

type MatchChatMessagesContextType = {
  chatMessages: MatchChatMessage[];
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isPending: boolean;
  loadOlderMessages: () => void;
};

const MatchChatMessagesContext =
  createContext<MatchChatMessagesContextType | null>(null);

export const MatchChatMessagesContextProvider = ({
  matchId,
  initialMessages,
  initialHasNextPage,
  children,
}: {
  matchId: string;
  initialMessages: MatchChatMessage[];
  initialHasNextPage: boolean;
  children: ReactNode;
}) => {
  const { subscribeObserverEvent } = useMatchObserverSocket();
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [isPending, startTransition] = useTransition();
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingOlderMessagesRef = useRef(false);
  const pendingScrollRestoreRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

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

        const response = await getMatchChatMessagesAction(matchId, nextPage);
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
  }, [hasNextPage, matchId, page]);

  useEffect(() => {
    const unsubscribe = subscribeObserverEvent("new_chat_message", (event) => {
      const newChatMessage = changeObjectValues<MatchChatMessage>(
        event.message,
        ["createdAt", "updatedAt", "respondedAt"],
        (value) => {
          if (typeof value === "string" || typeof value === "number") {
            return new Date(value);
          }
          return value;
        },
      );

      setChatMessages((prev) => {
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

  const values: MatchChatMessagesContextType = {
    chatMessages,
    scrollContainerRef,
    hasNextPage,
    isPending: isPending || isLoadingOlderMessages,
    loadOlderMessages,
  };

  return (
    <MatchChatMessagesContext.Provider value={values}>
      {children}
    </MatchChatMessagesContext.Provider>
  );
};

export const useMatchChatMessages = () => {
  const context = useContext(MatchChatMessagesContext);
  if (!context)
    throw new Error(
      "Match chat messages context must be used inside the match chat messages context provider.",
    );

  return context;
};
