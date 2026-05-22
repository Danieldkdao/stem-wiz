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

  if (activeUserMatch && activeUserMatch.connectionId !== connectionId) {
    return;
  }

  if (!activeUserMatch) {
    if (
      waitingUser?.connectionId === connectionId ||
      activeObserver?.connectionId === connectionId
    ) {
      cleanupUserConnection(userId);
    }

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
