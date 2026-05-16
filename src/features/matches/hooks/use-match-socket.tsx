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
import { MatchServerMessage } from "../lib/types";
import { MatchResultReasonType } from "@/db/shared";

type OpponentStatus = "active" | "disconnected";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/arena/ws`;
};

type MatchSocketContextType = {
  error: string | null;
  status: SocketStatus;
  lastEvent: ServerMessage | null;
  connect: () => Promise<void>;
  connectToMatch: (matchId: string) => boolean;
  opponentStatus: OpponentStatus;
  broadcastCodeSubmission: (matchId: string) => boolean;
  broadcastCodeSnapshot: (props: { matchId: string; code: string }) => boolean;
  broadcastCodeOutput: (props: {
    matchId: string;
    output?: string | null;
    error?: string | null;
  }) => boolean;
  broadcastRunningCode: (matchId: string) => boolean;
  broadcastMatchFinished: (
    matchId: string,
    reason: MatchResultReasonType,
  ) => boolean;
};

const MatchSocketContext = createContext<MatchSocketContextType | null>(null);

export const MatchSocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<WebSocket | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<MatchServerMessage | null>(null);
  const [opponentStatus, setOpponentStatus] =
    useState<OpponentStatus>("active");

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
        const message = JSON.parse(event.data) as MatchServerMessage;

        setLastEvent(message);

        const messageType = message.type;

        switch (messageType) {
          case "opponent_left_match":
            setOpponentStatus("disconnected");
            break;
          case "opponent_joined_match":
            setOpponentStatus("active");
            break;
          case "opponent_submitted_code":
            break;
          case "match_finished":
            break;
          case "error":
            setError(message.message);
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

  const connectToMatch = useCallback(
    (matchId: string) => {
      return send({ type: "connect_to_match", matchId });
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

  const broadcastMatchFinished = useCallback(
    (matchId: string, reason: MatchResultReasonType) => {
      return send({ type: "match_finished", matchId, reason });
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
    error,
    status,
    lastEvent,
    connect,
    connectToMatch,
    opponentStatus,
    broadcastCodeSubmission,
    broadcastCodeSnapshot,
    broadcastCodeOutput,
    broadcastRunningCode,
    broadcastMatchFinished,
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
