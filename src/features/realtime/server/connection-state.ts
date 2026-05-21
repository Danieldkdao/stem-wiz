import { RealtimeWebSocket } from "../lib/types";

const globalForRealtime = globalThis as typeof globalThis & {
  __realtimeState?: {
    socketsById: Map<string, RealtimeWebSocket>;
    connectionIdsByUser: Map<string, Set<string>>;
  };
};

export const getRealtimeState = () => {
  if (!globalForRealtime.__realtimeState) {
    globalForRealtime.__realtimeState = {
      socketsById: new Map(),
      connectionIdsByUser: new Map(),
    };
  }

  return globalForRealtime.__realtimeState;
};

export const registerSocket = (ws: RealtimeWebSocket) => {
  const { socketsById, connectionIdsByUser } = getRealtimeState();

  socketsById.set(ws.id, ws);

  const ids = connectionIdsByUser.get(ws.user.id) ?? new Set<string>();
  ids.add(ws.id);
  connectionIdsByUser.set(ws.user.id, ids);
};

export const unregisterSocket = (ws: RealtimeWebSocket) => {
  const { socketsById, connectionIdsByUser } = getRealtimeState();

  socketsById.delete(ws.id);

  const ids = connectionIdsByUser.get(ws.user.id);

  ids?.delete(ws.id);

  if (!ids?.size) {
    connectionIdsByUser.delete(ws.user.id);
  }
};

export const sendToClient = (message: unknown, ws?: RealtimeWebSocket) => {
  if (!ws || ws.readyState !== ws.OPEN) return;

  ws.send(JSON.stringify(message));
};

export const sendToUser = (userId: string, message: unknown) => {
  const { socketsById, connectionIdsByUser } = getRealtimeState();

  connectionIdsByUser.get(userId)?.forEach((connectionId) => {
    sendToClient(message, socketsById.get(connectionId));
  });
};

export const getSocketById = (connectionId: string) => {
  return getRealtimeState().socketsById.get(connectionId);
};

export const sendToConnection = (connectionId: string, message: unknown) => {
  sendToClient(message, getSocketById(connectionId));
};

export const hasUserConnections = (userId: string) => {
  return (getRealtimeState().connectionIdsByUser.get(userId)?.size ?? 0) > 0;
};
