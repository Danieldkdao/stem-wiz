import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";

export type RealtimeUser = {
  id: string;
  name: string;
  image?: string | null | undefined;
};

export type RealtimeWebSocket = WebSocket & {
  id: string;
  isAlive: boolean;
  user: RealtimeUser;
};

export type RealtimeSocketServer = HttpServer & {
  realtimeWss?: WebSocketServer;
  realtimeWsInitialized?: boolean;
};

export type UpgradeSocket = {
  write: (chunk: string) => unknown;
  destroy: () => unknown;
};
