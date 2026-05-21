import { sendToConnection } from "@/features/realtime/server/connection-state";
import {
  cleanupUserConnection,
  getArenaWsState,
  getOpponentConnectionId,
} from "./connection-state";
import {
  broadcastToMatchObservers,
  broadcastUpdatedMatchObserverCount,
} from "./match-observers";

const MATCH_PAGE_CONNECTION_GRACE_MS = 10000;

export const handleArenaDisconnect = async (
  userId: string,
  connectionId: string,
) => {
  const {
    activeMatchesByUser,
    activeObserversByUser,
    pendingConnectionCleanupByUser,
    usersInWaitingRoom,
  } = getArenaWsState();
  const activeUserMatch = activeMatchesByUser.get(userId);
  const waitingUser = usersInWaitingRoom.get(userId);
  const activeObserver = activeObserversByUser.get(userId);

  if (activeUserMatch && activeUserMatch.connectionId !== connectionId) {
    console.log("[arena:disconnect] stale connection closed", {
      userId,
      closedConnectionId: connectionId,
      activeConnectionId: activeUserMatch.connectionId,
    });
    return;
  }

  if (!activeUserMatch) {
    if (
      waitingUser?.connectionId === connectionId ||
      activeObserver?.connectionId === connectionId
    ) {
      console.log("[arena:disconnect] cleaning non-match arena state", {
        userId,
        connectionId,
        wasWaiting: waitingUser?.connectionId === connectionId,
        wasObserving: activeObserver?.connectionId === connectionId,
      });
      cleanupUserConnection(userId);
    }

    return;
  }

  if (activeUserMatch && !activeUserMatch.isConnected) {
    const existingCleanup = pendingConnectionCleanupByUser.get(userId);
    if (existingCleanup) clearTimeout(existingCleanup);

    console.log("[arena:disconnect] scheduling match page connection cleanup", {
      userId,
      connectionId,
      matchId: activeUserMatch.matchId,
      graceMs: MATCH_PAGE_CONNECTION_GRACE_MS,
    });

    const cleanupTimeout = setTimeout(() => {
      const latestUserMatch = activeMatchesByUser.get(userId);

      if (
        !latestUserMatch ||
        latestUserMatch.isConnected ||
        latestUserMatch.connectionId !== connectionId
      ) {
        pendingConnectionCleanupByUser.delete(userId);
        return;
      }

      const opponentConnectionId = getOpponentConnectionId(userId);

      if (opponentConnectionId) {
        sendToConnection(opponentConnectionId, { type: "opponent_left_match" });
      }

      void broadcastToMatchObservers(latestUserMatch.matchId, {
        type: "users_connection_statuses",
        users: [{ userId, isConnected: false }],
      });

      void broadcastUpdatedMatchObserverCount(userId);
      cleanupUserConnection(userId);
    }, MATCH_PAGE_CONNECTION_GRACE_MS);

    pendingConnectionCleanupByUser.set(userId, cleanupTimeout);
    return;
  }

  if (activeUserMatch) {
    const opponentConnectionId = getOpponentConnectionId(userId);

    if (opponentConnectionId) {
      sendToConnection(opponentConnectionId, { type: "opponent_left_match" });
    }

    await broadcastToMatchObservers(activeUserMatch.matchId, {
      type: "users_connection_statuses",
      users: [{ userId, isConnected: false }],
    });
  }

  await broadcastUpdatedMatchObserverCount(userId);
  cleanupUserConnection(userId);
};
