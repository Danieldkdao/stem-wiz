import {
  ActiveObserver,
  ActiveUser,
  PendingConnectionCleanup,
  WaitingRoomUser,
} from "../lib/types";

const globalForArenaWs = globalThis as typeof globalThis & {
  __arenaWsState?: {
    activeMatchesByUser: Map<string, ActiveUser>;
    usersInWaitingRoom: Map<string, WaitingRoomUser>;
    usersInObservingRoom: Set<string>;
    activeObserversByUser: Map<string, ActiveObserver>;
    pendingConnectionCleanupByUser: Map<string, PendingConnectionCleanup>;
  };
};

export const getArenaWsState = () => {
  if (!globalForArenaWs.__arenaWsState) {
    globalForArenaWs.__arenaWsState = {
      activeMatchesByUser: new Map(),
      usersInWaitingRoom: new Map(),
      usersInObservingRoom: new Set(),
      activeObserversByUser: new Map(),
      pendingConnectionCleanupByUser: new Map(),
    };
  }

  return globalForArenaWs.__arenaWsState;
};

export const getOpponentConnectionId = (userId: string) => {
  const { activeMatchesByUser } = getArenaWsState();

  const userMatch = activeMatchesByUser.get(userId);
  if (!userMatch) return;

  return [...activeMatchesByUser.entries()].find(
    ([otherUserId, otherMatch]) =>
      otherUserId !== userId && otherMatch.matchId === userMatch.matchId,
  )?.[1].connectionId;
};

export const cleanupUserConnection = (userId: string) => {
  const {
    usersInWaitingRoom,
    activeMatchesByUser,
    activeObserversByUser,
    usersInObservingRoom,
    pendingConnectionCleanupByUser,
  } = getArenaWsState();

  const pendingCleanup = pendingConnectionCleanupByUser.get(userId);
  if (pendingCleanup) {
    clearTimeout(pendingCleanup);
    pendingConnectionCleanupByUser.delete(userId);
  }

  activeMatchesByUser.delete(userId);
  usersInWaitingRoom.delete(userId);
  usersInObservingRoom.delete(userId);
  activeObserversByUser.delete(userId);
};
