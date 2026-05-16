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
import { MatchObserverServerMessage } from "../lib/types";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/arena/ws`;
};

type MatchObserverSocketContextType = {
  error: string | null;
  status: SocketStatus;
  lastEvent: ServerMessage | null;
  matchObserverCount: number;
  connect: () => Promise<void>;
  connectToMatchObservers: () => boolean;
  subscribeObserverMatch: (matchId: string) => boolean;
};

const MatchObserverSocketContext =
  createContext<MatchObserverSocketContextType | null>(null);

export const MatchObserverSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const socketRef = useRef<WebSocket | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<MatchObserverServerMessage | null>(
    null,
  );
  const [matchObserverCount, setMatchObserverCount] = useState(0);

  const connect = useCallback(async () => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    )
      return;

    setStatus("connecting");

    await fetch("/api/arena", {
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

        const messageType = message.type;

        switch (messageType) {
          case "match_observer_count_updated":
            const newCount = message.newCount;
            setMatchObserverCount(newCount);
            break;
          case "connection_error":
            setStatus("error");
            setError(message.message);
            break;
          case "error":
            setError(message.message);
            break;
          case "observable_match_count_updated":
          case "observer_code_snapshot":
          case "observer_code_output":
          case "observer_running_code":
            break;
          default:
            throw new Error(
              `Unknown match response type: ${messageType satisfies never}`,
            );
        }
      } catch (error) {
        console.error(error);
        setError("Something went wrong behind the scenes.");
        // todo: implement better error handling and
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

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const values = {
    error,
    status,
    lastEvent,
    matchObserverCount,
    connect,
    connectToMatchObservers,
    subscribeObserverMatch,
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
