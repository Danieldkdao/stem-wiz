"use client";

import {
  FriendMatchRequestStatusType,
  InvitationStatusType,
} from "@/db/shared";
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
  notifyFriendRequestResponse: (
    notificationId: string,
    action: Exclude<InvitationStatusType, "pending">,
  ) => void;
  notifyFriendChatAction: (
    notificationId: string,
    action: "new_chat" | "chat_deleted",
  ) => boolean;
  notifyFriendRequestSent: (notificationId: string) => boolean;
  notifyCommunityProblemFriends: (
    notificationEvents: {
      id: string;
      type:
        | "community_problem_shared_with_you"
        | "community_problem_access_revoked";
    }[],
  ) => boolean;
  notifyFriendsCommunityProblemDeletion: (notificationIds: string[]) => boolean;
  notifyNewFriendMatchRequest: (notificationId: string) => boolean;
  notifyFriendMatchRequestAction: (
    notificationId: string,
    action: Exclude<FriendMatchRequestStatusType, "pending" | "expired">,
  ) => void;
  notifyNewMatchObserverInvitations: (notificationIds: string[]) => boolean;
};

type NotificationEventListener<T extends NotificationServerMessageType> = (
  event: Extract<NotificationServerMessage, { type: T }>,
) => void;

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

  const notifyFriendRequestResponse = (
    notificationId: string,
    action: Exclude<InvitationStatusType, "pending">,
  ) => {
    return send({
      type: "new_notification",
      event: { type: `friend_request_${action}` as const, notificationId },
    });
  };

  const notifyFriendChatAction = (
    notificationId: string,
    action: "new_chat" | "chat_deleted",
  ) => {
    return send({
      type: "new_notification",
      event: { type: action, notificationId },
    });
  };

  const notifyCommunityProblemFriends = (
    notificationEvents: {
      id: string;
      type:
        | "community_problem_shared_with_you"
        | "community_problem_access_revoked";
    }[],
  ) => {
    if (!notificationEvents.length) return false;
    const results: boolean[] = [];

    notificationEvents.forEach((event) => {
      const result = send({
        type: "new_notification",
        event: { type: event.type, notificationId: event.id },
      });
      results.push(result);
    });
    return results.every(Boolean);
  };

  const notifyFriendsCommunityProblemDeletion = (notificationIds: string[]) => {
    if (!notificationIds.length) return false;
    const results: boolean[] = [];

    notificationIds.forEach((notificationId) => {
      const result = send({
        type: "new_notification",
        event: {
          notificationId,
          type: "community_problem_deleted",
        },
      });
      results.push(result);
    });

    return results.every(Boolean);
  };

  const notifyNewFriendMatchRequest = (notificationId: string) => {
    return send({
      type: "new_notification",
      event: { type: "new_match_request", notificationId },
    });
  };

  const notifyFriendMatchRequestAction = (
    notificationId: string,
    action: Exclude<FriendMatchRequestStatusType, "pending" | "expired">,
  ) => {
    return send({
      type: "new_notification",
      event: { type: `match_request_${action}` as const, notificationId },
    });
  };

  const notifyNewMatchObserverInvitations = (notificationIds: string[]) => {
    const results: boolean[] = [];

    notificationIds.forEach((notificationId) => {
      const result = send({
        type: "new_notification",
        event: { type: "new_match_observer_invitation", notificationId },
      });
      results.push(result);
    });

    return results.every(Boolean);
  };

  useEffect(() => {
    void connect().catch((error) => {
      console.error("[notifications:socket] failed to connect", error);
    });
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  const values: NotificationSocketContextType = {
    status,
    connect,
    subscribeNotificationEvent,
    lastEvent,
    notifyFriendRequestResponse,
    notifyFriendChatAction,
    notifyFriendRequestSent,
    notifyCommunityProblemFriends,
    notifyFriendsCommunityProblemDeletion,
    notifyNewFriendMatchRequest,
    notifyFriendMatchRequestAction,
    notifyNewMatchObserverInvitations,
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
