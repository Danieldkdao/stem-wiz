"use client";

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
import { NotificationClientMessage } from "../lib/schemas";
import {
  NotificationServerMessage,
  NotificationServerMessageType,
} from "../lib/types";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/realtime/ws`;
};

type NotificationSocketContextType = {
  status: SocketStatus;
  lastEvent: NotificationServerMessage | null;
  connect: () => Promise<void>;
  subscribeNotificationEvent: <T extends NotificationServerMessageType>(
    type: T,
    listener: NotificationEventListener<T>,
  ) => () => void;
  notifyFriendRequestAccepted: (notificationId: string) => boolean;
  notifyFriendRequestSent: (notificationId: string) => boolean;
};

export type NotificationEventListener<T extends NotificationServerMessageType> =
  (event: Extract<NotificationServerMessage, { type: T }>) => void;

const NotificationSocketContext =
  createContext<NotificationSocketContextType | null>(null);

export const NotificationSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const listenersRef = useRef(
    new Map<
      NotificationServerMessageType,
      Set<(event: NotificationServerMessage) => void>
    >(),
  );
  const ongoingConnectionRef = useRef<Promise<void> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<NotificationServerMessage | null>(
    null,
  );

  const subscribeNotificationEvent = useCallback(
    <T extends NotificationServerMessageType>(
      type: T,
      listener: NotificationEventListener<T>,
    ) => {
      const listeners = listenersRef.current.get(type) ?? new Set();
      listeners.add(listener as (event: NotificationServerMessage) => void);
      listenersRef.current.set(type, listeners);

      return () => {
        listeners.delete(
          listener as (event: NotificationServerMessage) => void,
        );
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
            const message = JSON.parse(event.data) as NotificationServerMessage;

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
              case "new_notification":
              case "error":
                break;
              default:
                throw new Error(
                  `Unknown notification response type: ${messageType satisfies never}`,
                );
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

  const send = useCallback((message: NotificationClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== socket.OPEN) return false;

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const notifyFriendRequestSent = (notificationId: string) => {
    return send({
      type: "new_notification",
      event: { type: "friend_request_sent", notificationId },
    });
  };

  const notifyFriendRequestAccepted = (notificationId: string) => {
    return send({
      type: "new_notification",
      event: { type: "friend_request_accepted", notificationId },
    });
  };

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const values: NotificationSocketContextType = {
    status,
    connect,
    subscribeNotificationEvent,
    lastEvent,
    notifyFriendRequestAccepted,
    notifyFriendRequestSent,
  };

  return (
    <NotificationSocketContext.Provider value={values}>
      {children}
    </NotificationSocketContext.Provider>
  );
};

export const useNotificationsSocket = () => {
  const context = useContext(NotificationSocketContext);
  if (!context) {
    throw new Error(
      "Notifications socket context must be used inside the notifications socket context provider.",
    );
  }

  return context;
};
