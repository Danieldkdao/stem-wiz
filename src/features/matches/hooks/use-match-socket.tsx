"use client";

import { ArenaClientMessage } from "@/features/arena/lib/schemas";
import { ArenaServerMessage } from "@/features/arena/lib/types";
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
import { MatchServerMessage, MatchServerMessageType } from "../lib/types";

type OpponentStatus = "active" | "disconnected";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/realtime/ws`;
};

type MatchSocketContextType = {
  status: SocketStatus;
  lastEvent: ArenaServerMessage | null;
  connect: () => Promise<void>;
  connectToMatch: (matchId: string) => boolean;
  disconnectFromMatch: (matchId: string) => boolean;
  subscribeMatchEvent: <T extends MatchServerMessageType>(
    type: T,
    listener: MatchEventListener<T>,
  ) => () => void;
  opponentStatus: OpponentStatus;
  broadcastCodeSubmission: (matchId: string) => boolean;
  broadcastCodeSnapshot: (props: { matchId: string; code: string }) => boolean;
  broadcastCodeOutput: (props: {
    matchId: string;
    output?: string | null;
    error?: string | null;
  }) => boolean;
  broadcastRunningCode: (matchId: string) => boolean;
};

export type MatchEventListener<T extends MatchServerMessageType> = (
  event: Extract<MatchServerMessage, { type: T }>,
) => void;

const MatchSocketContext = createContext<MatchSocketContextType | null>(null);

export const MatchSocketProvider = ({ children }: { children: ReactNode }) => {
  const listenersRef = useRef(
    new Map<MatchServerMessageType, Set<(event: MatchServerMessage) => void>>(),
  );
  const ongoingConnectionRef = useRef<Promise<void> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<MatchServerMessage | null>(null);
  const [opponentStatus, setOpponentStatus] =
    useState<OpponentStatus>("active");

  const subscribeMatchEvent = useCallback(
    <T extends MatchServerMessageType>(
      type: T,
      listener: MatchEventListener<T>,
    ) => {
      const listeners = listenersRef.current.get(type) ?? new Set();
      listeners.add(listener as (event: MatchServerMessage) => void);
      listenersRef.current.set(type, listeners);

      return () => {
        listeners.delete(listener as (event: MatchServerMessage) => void);
      };
    },
    [],
  );

  const connect = useCallback(async () => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }
    if (ongoingConnectionRef.current) {
      return ongoingConnectionRef.current;
    }

    ongoingConnectionRef.current = (async () => {
      setStatus("connecting");
      await fetch("/api/realtime", {
        method: "GET",
        credentials: "include",
      });

      const socket = new WebSocket(getSocketUrl());
      socketRef.current = socket;

      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => {
          if (socketRef.current !== socket) return;
          setStatus("open");
          resolve();
        };
        socket.onmessage = (event) => {
          if (socketRef.current !== socket) return;
          try {
            const message = JSON.parse(event.data) as MatchServerMessage;

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
              case "opponent_left_match":
                setOpponentStatus("disconnected");
                break;
              case "opponent_joined_match":
                setOpponentStatus("active");
                break;
              case "opponent_submitted_code":
              case "match_finished":
              case "error":
                break;
              default: {
                const unexpectedMessage = message as { type?: unknown };
                messageType satisfies never;
                console.error(
                  "[match:socket] received an unexpected websocket event",
                  {
                    messageType: unexpectedMessage.type,
                    message: unexpectedMessage,
                  },
                );
                break;
              }
            }
          } catch (error) {
            console.error(error);
          }
        };
        socket.onerror = () => {
          if (socketRef.current !== socket) return;
          setStatus("error");
          reject();
        };
        socket.onclose = () => {
          if (socketRef.current !== socket) return;
          setStatus("closed");
          reject();

          if (socketRef.current === socket) {
            socketRef.current = null;
          }
        };
      });
    })().finally(() => {
      ongoingConnectionRef.current = null;
    });

    return ongoingConnectionRef.current;
  }, []);

  const send = useCallback((message: ArenaClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== socket.OPEN) return false;

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const connectToMatch = useCallback(
    (matchId: string) => {
      return send({ type: "connect_to_match", matchId });
    },
    [send],
  );

  const disconnectFromMatch = useCallback(
    (matchId: string) => {
      return send({ type: "disconnect_from_match", matchId });
    },
    [send],
  );

  const broadcastCodeSnapshot = useCallback(
    (props: { matchId: string; code: string }) => {
      return send({ type: "code_snapshot", ...props });
    },
    [send],
  );

  const broadcastCodeOutput = useCallback(
    (props: {
      matchId: string;
      output?: string | null;
      error?: string | null;
    }) => {
      return send({ type: "output_snapshot", ...props });
    },
    [send],
  );

  const broadcastCodeSubmission = useCallback(
    (matchId: string) => {
      return send({ type: "submitted_code", matchId });
    },
    [send],
  );

  const broadcastRunningCode = useCallback(
    (matchId: string) => {
      return send({ type: "running_code", matchId });
    },
    [send],
  );

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const values: MatchSocketContextType = {
    status,
    lastEvent,
    connect,
    connectToMatch,
    disconnectFromMatch,
    subscribeMatchEvent,
    opponentStatus,
    broadcastCodeSubmission,
    broadcastCodeSnapshot,
    broadcastCodeOutput,
    broadcastRunningCode,
  };

  return (
    <MatchSocketContext.Provider value={values}>
      {children}
    </MatchSocketContext.Provider>
  );
};

export const useMatchSocket = () => {
  const context = useContext(MatchSocketContext);
  if (!context) {
    throw new Error(
      "Match socket context must be used inside the match socket context provider.",
    );
  }

  return context;
};
