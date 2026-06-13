"use client";

import { SocketStatus } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArenaWaitingServerMessage } from "../lib/types";
import { RealtimeUser } from "@/features/realtime/lib/types";
import { ArenaClientMessage } from "../lib/schemas";

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

  const clearMatch = useCallback(() => {
    setMatch(null);
  }, []);

  const clearLastEvent = useCallback(() => {
    setLastEvent(null);
  }, []);

  const clearWaitingState = useCallback(() => {
    setMatch(null);
    setLastEvent(null);
  }, []);

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
      clearWaitingState();
    };

    socket.onclose = () => {
      setStatus("closed");
      clearWaitingState();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [clearWaitingState]);

  const send = useCallback((message: ArenaClientMessage) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;

    socketRef.current.send(JSON.stringify(message));
    return true;
  }, []);

  const joinWaitingRoom = useCallback(() => {
    clearWaitingState();
    return send({ type: "join_waiting_room" });
  }, [clearWaitingState, send]);

  const leaveWaitingRoom = useCallback(() => {
    clearWaitingState();
    return send({ type: "leave_waiting_room" });
  }, [clearWaitingState, send]);

  useEffect(() => {
    return () => {
      clearWaitingState();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [clearWaitingState]);

  return {
    status,
    match,
    lastEvent,
    connect,
    joinWaitingRoom,
    leaveWaitingRoom,
    clearMatch,
    clearLastEvent,
    clearWaitingState,
  };
};
