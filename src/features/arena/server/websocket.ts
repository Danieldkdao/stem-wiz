import { auth } from "@/lib/auth/auth";
import { IncomingMessage } from "node:http";
import { WebSocketServer } from "ws";
import { clientMessageSchema } from "../lib/schemas";
import { ArenaSocketServer, ArenaWebSocket, UpgradeSocket } from "../lib/types";
import {
  cleanupUserConnection,
  getArenaWsState,
  getOpponentSocket,
  sendToClient,
} from "./connection-state";
import { joinWaitingRoom, leaveWaitingRoom } from "./matchmaking";
import { broadcastCodeSubmission, connectToMatch } from "./match-realtime";
import {
  broadcastCodeOutput,
  broadcastCodeSnapshot,
  broadcastMatchFinished,
  broadcastRunningCode,
  broadcastToMatchObservers,
  broadcastUpdatedMatchObserverCount,
  broadcastUserSubmittedCode,
  connectToObservers,
  leaveObserverMatch,
  subscribeObserverMatch,
} from "./match-observers";
import { broadcastChatMessageSent } from "./chats";

const toHeaders = (req: IncomingMessage) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    if (value) {
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

export const initArenaWebSocketServer = (server: ArenaSocketServer) => {
  const { usersInWaitingRoom, activeMatchesByUser, socketsByUser } =
    getArenaWsState();
  if (server.arenaWsInitialized && server.arenaWss) {
    return server.arenaWss;
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (request, socket, head) => {
    const url = new URL(
      request.url ?? "",
      `http://${request.headers.host ?? "localhost"}`,
    );

    if (url.pathname !== "/api/arena/ws") {
      return;
    }

    const session = await auth.api.getSession({
      headers: toHeaders(request),
    });

    if (!session) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log("handleUpgrade callback fired");

      const authedWs = ws as ArenaWebSocket;
      authedWs.user = {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      };

      wss.emit("connection", authedWs, request);
    });
  });

  wss.on("connection", (ws: ArenaWebSocket, _request) => {
    console.log("client connected");

    ws.isAlive = true;
    ws.on("error", console.error);
    ws.on("pong", () => (ws.isAlive = true));

    if (ws.user.id) {
      socketsByUser.set(ws.user.id, ws);
    }

    ws.on("message", async (data) => {
      try {
        const json = JSON.parse(data.toString());
        const result = clientMessageSchema.safeParse(json);

        console.log(json, result.data);

        if (!result.success) {
          throw new Error("Invalid message format: ", json);
        }

        const message = result.data;

        const messageType = message.type;

        switch (messageType) {
          case "join_waiting_room":
            await joinWaitingRoom(ws);
            break;
          case "leave_waiting_room":
            leaveWaitingRoom(ws);
            break;
          case "connect_to_match":
            await connectToMatch(ws, message.matchId);
            break;
          case "submitted_code":
            await broadcastCodeSubmission(ws, message.matchId);
            break;
          case "connect_to_observers":
            connectToObservers(ws);
            break;
          case "subscribe_observer_match":
            await subscribeObserverMatch(ws, message.matchId);
            break;
          case "code_snapshot":
            await broadcastCodeSnapshot(ws, message.matchId, message.code);
            break;
          case "output_snapshot":
            await broadcastCodeOutput(
              ws,
              message.matchId,
              message.output,
              message.error,
            );
            break;
          case "running_code":
            await broadcastRunningCode(ws, message.matchId);
            break;
          case "user_submitted_code":
            await broadcastUserSubmittedCode(ws, message.matchId);
            break;
          case "match_finished":
            await broadcastMatchFinished(ws, message.matchId, message.reason);
            break;
          case "chat_message_sent":
            await broadcastChatMessageSent(ws, message.matchId, message);
            break;
          case "leave_observer_match":
            await leaveObserverMatch(ws, message.matchId);
            break;
          default:
            throw new Error(
              `Invalid message type: ${messageType satisfies never}`,
            );
        }
      } catch (error) {
        console.error(error);
        sendToClient(
          {
            type: "error",
            message: "Invalid message format.",
          },
          ws,
        );
      }
    });

    ws.on("close", async () => {
      const userId = ws.user.id;
      const isCurrentUserSocket = socketsByUser.get(userId) === ws;

      if (!isCurrentUserSocket) {
        console.log("stale client socket disconnected");
        return;
      }

      const activeUserMatch = activeMatchesByUser.get(userId);
      if (activeUserMatch) {
        const opponentSocket = getOpponentSocket(userId);

        sendToClient({ type: "opponent_left_match" }, opponentSocket?.socket);
        const activeMatch = activeMatchesByUser.get(userId);
        if (activeMatch)
          broadcastToMatchObservers(activeMatch.matchId, {
            type: "users_connection_statuses",
            users: [{ userId, isConnected: false }],
          });
      }
      console.log("client disconnected");

      cleanupUserConnection(userId);
      await broadcastUpdatedMatchObserverCount(userId);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((originalWs) => {
      const ws = originalWs as ArenaWebSocket;
      if (!ws.isAlive) {
        activeMatchesByUser.delete(ws.user.id);
        socketsByUser.delete(ws.user.id);
        usersInWaitingRoom.delete(ws.user.id);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  server.arenaWss = wss;
  server.arenaWsInitialized = true;

  return wss;
};
