"use client";

import { ClientMessage, ServerMessage } from "@/features/arena/lib/types";
import { SocketStatus } from "@/lib/types";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MatchObserverServerMessage,
  MatchObserverServerMessageType,
} from "../lib/types";
import { MatchResultReasonType } from "@/db/shared";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/realtime/ws`;
};

type MatchObserverSocketContextType = {
  status: SocketStatus;
  lastEvent: ServerMessage | null;
  matchObserverCount: number;
  matchCompletionReason: MatchResultReasonType | null;
  subscribeObserverEvent: <T extends MatchObserverServerMessageType>(
    type: T,
    listener: ObserverEventListener<T>,
  ) => () => void;
  connect: () => Promise<void>;
  connectToMatchObservers: () => boolean;
  subscribeObserverMatch: (matchId: string) => boolean;
  broadcastChatMessageSent: (message: {
    chatId: string;
    matchId: string;
    messageId: string;
  }) => boolean;
  leaveObserverMatch: (matchId: string) => void;
};

export type ObserverEventListener<T extends MatchObserverServerMessageType> = (
  event: Extract<MatchObserverServerMessage, { type: T }>,
) => void;

const MatchObserverSocketContext =
  createContext<MatchObserverSocketContextType | null>(null);

export const MatchObserverSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const listenersRef = useRef(
    new Map<
      MatchObserverServerMessageType,
      Set<(event: MatchObserverServerMessage) => void>
    >(),
  );
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<MatchObserverServerMessage | null>(
    null,
  );
  const [matchCompletionReason, setMatchCompletionReason] =
    useState<MatchResultReasonType | null>(null);
  const [matchObserverCount, setMatchObserverCount] = useState(0);

  const subscribeObserverEvent = useCallback(
    <T extends MatchObserverServerMessageType>(
      type: T,
      listener: ObserverEventListener<T>,
    ) => {
      const listeners = listenersRef.current.get(type) ?? new Set();
      listeners.add(listener as (event: MatchObserverServerMessage) => void);
      listenersRef.current.set(type, listeners);

      return () => {
        listeners.delete(
          listener as (event: MatchObserverServerMessage) => void,
        );
      };
    },
    [],
  );

  const connect = useCallback(async () => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    )
      return;

    setStatus("connecting");

    await fetch("/api/realtime", {
      method: "GET",
      credentials: "include",
    });

    const socket = new WebSocket(getSocketUrl());
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("open");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as MatchObserverServerMessage;

        setLastEvent(message);

        listenersRef.current.get(message.type)?.forEach((listener) => {
          try {
            listener(message);
          } catch (error) {
            console.error(error);
          }
        });

        const messageType = message.type;

        switch (messageType) {
          case "match_observer_count_updated":
            const newCount = message.newCount;
            setMatchObserverCount(newCount);
            break;
          case "connection_error":
            setStatus("error");
            break;
          case "match_finished":
            setMatchCompletionReason(message.reason);
            break;
          case "users_connection_statuses":
          case "observable_match_count_updated":
          case "observer_code_snapshot":
          case "observer_code_output":
          case "observer_running_code":
          case "user_submitted_code":
          case "new_chat_message":
          case "error":
            break;
          default:
            throw new Error(
              `Unknown match response type: ${messageType satisfies never}`,
            );
        }
      } catch (error) {
        console.error(error);
      }
    };
    socket.onerror = () => {
      setStatus("error");
    };

    socket.onclose = () => {
      setStatus("closed");

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;

    socketRef.current.send(JSON.stringify(message));
    return true;
  }, []);

  const connectToMatchObservers = useCallback(() => {
    return send({ type: "connect_to_observers" });
  }, [send]);

  const subscribeObserverMatch = useCallback(
    (matchId: string) => {
      return send({ type: "subscribe_observer_match", matchId });
    },
    [send],
  );

  const broadcastChatMessageSent = useCallback(
    (message: { chatId: string; matchId: string; messageId: string }) => {
      return send({ type: "chat_message_sent", ...message });
    },
    [send],
  );

  const leaveObserverMatch = (matchId: string) => {
    return send({ type: "leave_observer_match", matchId });
  };

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const values: MatchObserverSocketContextType = {
    status,
    lastEvent,
    matchObserverCount,
    connect,
    subscribeObserverEvent,
    connectToMatchObservers,
    subscribeObserverMatch,
    matchCompletionReason,
    broadcastChatMessageSent,
    leaveObserverMatch,
  };

  return (
    <MatchObserverSocketContext.Provider value={values}>
      {children}
    </MatchObserverSocketContext.Provider>
  );
};

export const useMatchObserverSocket = () => {
  const context = useContext(MatchObserverSocketContext);
  if (!context) {
    throw new Error(
      "Match observer context must be used inside the match observer context provider.",
    );
  }

  return context;
};
