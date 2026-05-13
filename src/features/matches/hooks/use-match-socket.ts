"use client";

import {
  ClientMessage,
  MatchServerMessage,
  ServerMessage,
} from "@/features/arena/lib/types";
import { SocketStatus } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

type OpponentStatus = "active" | "disconnected";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/arena/ws`;
};

export const useMatchSocket = (matchId: string) => {
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<ServerMessage | null>(null);
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
          default:
            throw new Error(
              `Unknown match response type: ${messageType satisfies never}`,
            );
        }
      } catch (error) {
        console.error(error);
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

  const connectToMatch = useCallback(() => {
    return send({ type: "connect_to_match", matchId });
  }, [send, matchId]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  return {
    status,
    lastEvent,
    connect,
    connectToMatch,
    opponentStatus,
  };
};
