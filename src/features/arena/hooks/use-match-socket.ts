"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UserInfo = {
  id: string;
  name: string;
  image?: string | null | undefined;
};

type ClientMessage =
  | { type: "join_waiting_room" }
  | { type: "leave_waiting_room" };

export type ServerMessage =
  | {
      // todo: move the type fields into their own constant with their own type
      type: "match_found";
      matchId: string;
      opponent: UserInfo;
    }
  | { type: "no_matches_found" }
  | { type: "no_user_settings" }
  | {
      type: "error";
      message: string;
    };

export type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/arena/ws`;
};

export const useMatchSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<ServerMessage | null>(null);
  const [match, setMatch] = useState<{
    matchId: string;
    opponent: UserInfo;
  } | null>(null);

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
        const message = JSON.parse(event.data) as ServerMessage;

        setLastEvent(message);

        if (message.type === "match_found") {
          setMatch(message);
        }
      } catch (error) {
        console.error(error);
        // todo: maybe implement better error handling
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

  const joinWaitingRoom = useCallback(() => {
    return send({ type: "join_waiting_room" });
  }, [send]);

  const leaveWaitingRoom = useCallback(() => {
    return send({ type: "leave_waiting_room" });
  }, [send]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  return {
    status,
    match,
    lastEvent,
    connect,
    joinWaitingRoom,
    leaveWaitingRoom,
  };
};
