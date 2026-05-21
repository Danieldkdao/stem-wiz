"use client";

import { SocketStatus } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArenaWaitingServerMessage, ClientMessage } from "../lib/types";
import { RealtimeUser } from "@/features/realtime/lib/types";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/realtime/ws`;
};

export const useWaitingArenaSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<ArenaWaitingServerMessage | null>(
    null,
  );
  const [match, setMatch] = useState<{
    matchId: string;
    opponent: RealtimeUser;
  } | null>(null);

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
        const message = JSON.parse(event.data) as ArenaWaitingServerMessage;

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
