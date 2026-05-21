import { auth } from "@/lib/auth/auth";
import { IncomingMessage } from "node:http";
import { RawData, WebSocketServer } from "ws";
import {
  RealtimeSocketServer,
  RealtimeWebSocket,
  UpgradeSocket,
} from "../lib/types";
import { handleRealtimeMessage } from "./message-router";
import { registerSocket, unregisterSocket } from "./connection-state";
import { handleArenaDisconnect } from "@/features/arena/server/disconnect";
import { randomUUID } from "node:crypto";

const toHeaders = (req: IncomingMessage) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else {
      headers.set(key, value);
    }
  }

  return headers;
};

const rejectUpgrade = (
  socket: UpgradeSocket,
  status: 400 | 401 | 403,
  statusText: "Bad Request" | "Unauthorized" | "Forbidden",
) => {
  socket.write(`HTTP/1.1 ${status} ${statusText}\r\n\r\n`);
  socket.destroy();
};

const getMessageByteLength = (data: RawData) => {
  if (Array.isArray(data)) {
    return data.reduce((total, chunk) => total + chunk.byteLength, 0);
  }

  return data.byteLength;
};

export const initRealtimeWebSocket = (server: RealtimeSocketServer) => {
  if (server.realtimeWsInitialized && server.realtimeWss) {
    console.log("[realtime:server] already initialized");
    return server.realtimeWss;
  }

  const wss = new WebSocketServer({ noServer: true });
  console.log("[realtime:server] initializing websocket server", {
    wsPath: "/api/realtime/ws",
  });

  server.on("upgrade", async (request, socket, head) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);

    if (url.pathname !== "/api/realtime/ws") return;

    console.log("[realtime:upgrade] received websocket upgrade", {
      path: url.pathname,
      host: request.headers.host,
    });

    const session = await auth.api.getSession({ headers: toHeaders(request) });

    if (!session) {
      console.log("[realtime:upgrade] rejected unauthenticated socket", {
        path: url.pathname,
      });
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      const authedWs = ws as RealtimeWebSocket;

      authedWs.id = randomUUID();
      authedWs.user = {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      };

      console.log("[realtime:upgrade] accepted authenticated socket", {
        userId: authedWs.user.id,
        connectionId: authedWs.id,
        path: url.pathname,
      });

      wss.emit("connection", authedWs, request);
    });
  });

  wss.on("connection", (ws: RealtimeWebSocket) => {
    console.log("[realtime:connection] client connected", {
      userId: ws.user.id,
      connectionId: ws.id,
    });

    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));
    ws.on("error", (error) => {
      console.error("[realtime:connection] socket error", {
        userId: ws.user.id,
        connectionId: ws.id,
        error,
      });
    });

    registerSocket(ws);
    console.log("[realtime:connection] socket registered", {
      userId: ws.user.id,
      connectionId: ws.id,
    });

    ws.on("message", async (data) => {
      console.log("[realtime:message] received message", {
        userId: ws.user.id,
        connectionId: ws.id,
        byteLength: getMessageByteLength(data),
      });
      await handleRealtimeMessage(ws, data as Buffer);
    });

    ws.on("close", async () => {
      console.log("[realtime:connection] client disconnected", {
        userId: ws.user.id,
        connectionId: ws.id,
      });
      unregisterSocket(ws);
      await handleArenaDisconnect(ws.user.id, ws.id);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((originalWs) => {
      const ws = originalWs as RealtimeWebSocket;

      if (!ws.isAlive) {
        console.log("[realtime:heartbeat] terminating stale socket", {
          userId: ws.user.id,
          connectionId: ws.id,
        });
        unregisterSocket(ws);
        void handleArenaDisconnect(ws.user.id, ws.id);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  server.realtimeWss = wss;
  server.realtimeWsInitialized = true;
  console.log("[realtime:server] websocket server initialized");

  return wss;
};
