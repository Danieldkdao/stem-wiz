import {
  ActiveUser,
  ArenaWebSocket,
  ServerMessage,
  WaitingRoomUser,
} from "../lib/types";

const globalForArenaWs = globalThis as typeof globalThis & {
  __arenaWsState?: {
    activeMatchesByUser: Map<string, ActiveUser>;
    socketsByUser: Map<string, ArenaWebSocket>;
    usersInWaitingRoom: Map<string, WaitingRoomUser>;
  };
};

export const getArenaWsState = () => {
  if (!globalForArenaWs.__arenaWsState) {
    globalForArenaWs.__arenaWsState = {
      activeMatchesByUser: new Map(),
      socketsByUser: new Map(),
      usersInWaitingRoom: new Map(),
    };
  }

  return globalForArenaWs.__arenaWsState;
};

export const sendToClient = (message: ServerMessage, ws?: ArenaWebSocket) => {
  if (!ws || ws.readyState !== ws.OPEN) return;

  ws.send(JSON.stringify(message));
};

export const sendToUser = (userId: string, message: ServerMessage) => {
  const { socketsByUser } = getArenaWsState();
  sendToClient(message, socketsByUser.get(userId));
};

export const getOpponentSocket = (userId: string) => {
  const { activeMatchesByUser, socketsByUser } = getArenaWsState();

  const userMatch = activeMatchesByUser.get(userId);
  if (!userMatch) return;

  const opponentUserId = [...activeMatchesByUser.entries()].find(
    ([otherUserId, otherMatchId]) =>
      otherUserId !== userId && otherMatchId.matchId === userMatch.matchId,
  )?.[0];
  if (!opponentUserId) return;

  return {
    userId: opponentUserId,
    socket: socketsByUser.get(opponentUserId),
  };
};

export const cleanupUserConnection = (userId: string) => {
  const { socketsByUser, usersInWaitingRoom } = getArenaWsState();

  socketsByUser.delete(userId);
  usersInWaitingRoom.delete(userId);
};
