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
  const ongoingConnectionRef = useRef<Promise<void> | null>(null);
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

  // todo: remove after testing
  // const connectBefore = useCallback(async () => {
  //   if (
  //     socketRef.current?.readyState === WebSocket.OPEN ||
  //     socketRef.current?.readyState === WebSocket.CONNECTING
  //   )
  //     return;

  //   setStatus("connecting");

  //   await fetch("/api/realtime", {
  //     method: "GET",
  //     credentials: "include",
  //   });

  //   const socket = new WebSocket(getSocketUrl());
  //   socketRef.current = socket;

  //   socket.onopen = () => {
  //     setStatus("open");
  //   };

  //   socket.onmessage = (event) => {
  //     try {
  //       const message = JSON.parse(event.data) as ArenaWaitingServerMessage;

  //       setLastEvent(message);

  //       if (message.type === "match_found") {
  //         setMatch(message);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       // todo: maybe implement better error handling
  //     }
  //   };

  //   socket.onerror = () => {
  //     setStatus("error");
  //     clearWaitingState();
  //   };

  //   socket.onclose = () => {
  //     setStatus("closed");
  //     clearWaitingState();

  //     if (socketRef.current === socket) {
  //       socketRef.current = null;
  //     }
  //   };
  // }, [clearWaitingState]);

  const connect = useCallback(async () => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    )
      return;
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
          if (socketRef.current !== socket) return;
          setStatus("error");
          clearWaitingState();
          reject();
        };

        socket.onclose = () => {
          if (socketRef.current !== socket) return;
          setStatus("closed");
          clearWaitingState();
          reject();

          if (socketRef.current === socket) {
            socketRef.current = null;
          }
        };
      });
    })().finally(() => {
      ongoingConnectionRef.current = null;
    });
  }, [clearWaitingState]);

  const send = useCallback((message: ArenaClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const joinWaitingRoom = useCallback(() => {
    return send({ type: "join_waiting_room" });
  }, [send]);

  const leaveWaitingRoom = useCallback(() => {
    clearWaitingState();
    return send({ type: "leave_waiting_room" });
  }, [clearWaitingState, send]);

  useEffect(() => {
    return () => {
      leaveWaitingRoom();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [leaveWaitingRoom]);

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
