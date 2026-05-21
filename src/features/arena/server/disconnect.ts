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

export const handleArenaDisconnect = async (
  userId: string,
  connectionId: string,
) => {
  const { activeMatchesByUser, activeObserversByUser, usersInWaitingRoom } =
    getArenaWsState();
  const activeUserMatch = activeMatchesByUser.get(userId);
  const waitingUser = usersInWaitingRoom.get(userId);
  const activeObserver = activeObserversByUser.get(userId);

  console.log("[arena:disconnect] handling connection close", {
    userId,
    closedConnectionId: connectionId,
    activeMatchState: activeUserMatch,
    waitingRoomState: waitingUser
      ? {
          connectionId: waitingUser.connectionId,
          preferredLanguage: waitingUser.userSettings.preferredLanguage,
        }
      : undefined,
    activeObserverState: activeObserver,
    activeMatchUserIds: [...activeMatchesByUser.keys()],
    waitingRoomUserIds: [...usersInWaitingRoom.keys()],
    observerUserIds: [...activeObserversByUser.keys()],
  });

  if (activeUserMatch && activeUserMatch.connectionId !== connectionId) {
    console.log("[arena:disconnect] stale connection closed", {
      userId,
      closedConnectionId: connectionId,
      activeConnectionId: activeUserMatch.connectionId,
      matchId: activeUserMatch.matchId,
      isConnected: activeUserMatch.isConnected,
      action: "ignored",
    });
    return;
  }

  if (!activeUserMatch) {
    console.log("[arena:disconnect] no active match state found", {
      userId,
      closedConnectionId: connectionId,
      hasWaitingRoomState: !!waitingUser,
      waitingRoomConnectionId: waitingUser?.connectionId,
      hasObserverState: !!activeObserver,
      observerConnectionId: activeObserver?.connectionId,
    });

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
    } else {
      console.log("[arena:disconnect] no matching arena state to clean", {
        userId,
        closedConnectionId: connectionId,
      });
    }

    return;
  }

  if (activeUserMatch) {
    const opponentConnectionId = getOpponentConnectionId(userId);
    console.log("[arena:disconnect] active match connection closed", {
      userId,
      closedConnectionId: connectionId,
      matchId: activeUserMatch.matchId,
      opponentConnectionId,
      activeMatchState: activeUserMatch,
    });

    if (opponentConnectionId) {
      console.log("[arena:disconnect] notifying opponent user left match", {
        userId,
        matchId: activeUserMatch.matchId,
        opponentConnectionId,
      });
      sendToConnection(opponentConnectionId, { type: "opponent_left_match" });
    } else {
      console.log("[arena:disconnect] no opponent connection to notify", {
        userId,
        matchId: activeUserMatch.matchId,
      });
    }

    console.log("[arena:disconnect] broadcasting observer disconnect status", {
      userId,
      matchId: activeUserMatch.matchId,
    });
    await broadcastToMatchObservers(activeUserMatch.matchId, {
      type: "users_connection_statuses",
      users: [{ userId, isConnected: false }],
    });
  }

  console.log("[arena:disconnect] updating observer count", {
    userId,
    matchId: activeUserMatch.matchId,
  });
  await broadcastUpdatedMatchObserverCount(userId);

  console.log("[arena:disconnect] cleaning active arena state", {
    userId,
    closedConnectionId: connectionId,
    matchId: activeUserMatch.matchId,
  });
  cleanupUserConnection(userId);

  console.log("[arena:disconnect] complete", {
    userId,
    closedConnectionId: connectionId,
    remainingActiveMatchUserIds: [...activeMatchesByUser.keys()],
    remainingWaitingRoomUserIds: [...usersInWaitingRoom.keys()],
    remainingObserverUserIds: [...activeObserversByUser.keys()],
  });
};
