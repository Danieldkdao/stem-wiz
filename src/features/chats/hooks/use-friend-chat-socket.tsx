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
import { FriendChatClientMessage } from "../lib/schemas";
import {
  FriendChatServerMessage,
  FriendChatServerMessageType,
} from "../lib/types";

const getSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/realtime/ws`;
};

type FriendChatSocketContextType = {
  status: SocketStatus;
  lastEvent: FriendChatServerMessage | null;
  subscribeEvent: <T extends FriendChatServerMessageType>(
    type: T,
    listener: EventListener<T>,
  ) => () => void;
  friendsConnectionStatuses: Map<string, Set<string>>;
  connect: () => Promise<void>;
  connectToChat: (chatId: string) => boolean;
  sendChatMessage: (messageId: string) => boolean;
  broadcastMessageUpdates: (messageId: string) => boolean;
  broadcastMessageDeleted: (messageId: string) => boolean;
  broadcastChatUpdated: (chatId: string) => boolean;
  broadcastChatDeleted: (chatId: string) => boolean;
};

export type EventListener<T extends FriendChatServerMessageType> = (
  event: Extract<FriendChatServerMessage, { type: T }>,
) => void;

const FriendChatSocketContext =
  createContext<FriendChatSocketContextType | null>(null);

export const FriendChatSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const listenersRef = useRef(
    new Map<
      FriendChatServerMessageType,
      Set<(event: FriendChatServerMessage) => void>
    >(),
  );
  const socketRef = useRef<WebSocket | null>(null);
  const ongoingConnectionRef = useRef<Promise<void> | null>(null);

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastEvent, setLastEvent] = useState<FriendChatServerMessage | null>(
    null,
  );
  const [friendsConnectionStatuses, setFriendsConnectionStatuses] = useState<
    Map<string, Set<string>>
  >(new Map());

  const subscribeEvent = useCallback(
    <T extends FriendChatServerMessageType>(
      type: T,
      listener: EventListener<T>,
    ) => {
      const listeners = listenersRef.current.get(type) ?? new Set();
      listeners.add(listener as (event: FriendChatServerMessage) => void);
      listenersRef.current.set(type, listeners);

      return () => {
        listeners.delete(listener as (event: FriendChatServerMessage) => void);
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
            const message = JSON.parse(event.data) as FriendChatServerMessage;

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
              case "connection_error":
                setStatus("error");
                break;
              case "friend_connected":
                setFriendsConnectionStatuses((currentStatuses) => {
                  const next = new Map(currentStatuses);
                  const currentChatStatuses = new Set(
                    next.get(message.chatId) ?? [],
                  );
                  const newChatStatuses = currentChatStatuses.add(
                    message.userId,
                  );
                  return next.set(message.chatId, newChatStatuses);
                });
                break;
              case "friend_disconnected":
                setFriendsConnectionStatuses((currentStatuses) => {
                  const next = new Map(currentStatuses);
                  const currentChatStatuses = new Set(
                    next.get(message.chatId) ?? [],
                  );
                  currentChatStatuses.delete(message.userId);

                  if (currentChatStatuses.size === 0) {
                    next.delete(message.chatId);
                  } else {
                    next.set(message.chatId, currentChatStatuses);
                  }

                  return next;
                });
                break;
              case "friend_message_sent":
              case "friend_message_updated":
              case "friend_message_deleted":
              case "friend_chat_updated":
              case "friend_chat_deleted":
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
          if (socketRef.current !== socket) return;
          setStatus("error");

          setFriendsConnectionStatuses(new Map());

          reject();
        };
        socket.onclose = () => {
          if (socketRef.current !== socket) return;
          setStatus("closed");

          setFriendsConnectionStatuses(new Map());

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

  const send = useCallback((message: FriendChatClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== socket.OPEN) return false;

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const connectToChat = useCallback(
    (chatId: string) => {
      return send({
        type: "connect_to_friend_chat",
        chatId,
      });
    },
    [send],
  );

  const sendChatMessage = useCallback(
    (messageId: string) => {
      return send({ type: "new_message", messageId });
    },
    [send],
  );

  const broadcastMessageUpdates = useCallback(
    (messageId: string) => {
      return send({ type: "updated_message", messageId });
    },
    [send],
  );

  const broadcastMessageDeleted = useCallback(
    (messageId: string) => {
      return send({ type: "deleted_message", messageId });
    },
    [send],
  );

  const broadcastChatUpdated = useCallback(
    (chatId: string) => {
      return send({ type: "updated_chat", chatId });
    },
    [send],
  );

  const broadcastChatDeleted = useCallback(
    (chatId: string) => {
      return send({ type: "deleted_chat", chatId });
    },
    [send],
  );

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const values: FriendChatSocketContextType = {
    status,
    lastEvent,
    connect,
    friendsConnectionStatuses,
    subscribeEvent,
    connectToChat,
    sendChatMessage,
    broadcastMessageUpdates,
    broadcastMessageDeleted,
    broadcastChatUpdated,
    broadcastChatDeleted,
  };

  return (
    <FriendChatSocketContext.Provider value={values}>
      {children}
    </FriendChatSocketContext.Provider>
  );
};

export const useFriendChatSocket = () => {
  const context = useContext(FriendChatSocketContext);
  if (!context) {
    throw new Error(
      "Friend chat context must be used inside the friend chat context provider.",
    );
  }

  return context;
};
