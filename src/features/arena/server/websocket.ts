import { db } from "@/db/db";
import { MatchTable, UserMatchTable } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { Server as HttpServer, IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import z from "zod";

export type ArenaSocketServer = HttpServer & {
  // todo: note that you might have to switch to https in prod
  arenaWss?: WebSocketServer;
  arenaWsInitialized?: boolean;
};

type ArenaWebSocket = WebSocket & {
  isAlive: boolean;
  userId: string;
};

const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join_waiting_room"),
  }),
  z.object({
    type: z.literal("leave_waiting_room"),
  }),
  // todo: add the rest of the events later
]);

const globalForArenaWs = globalThis as typeof globalThis & {
  __arenaWsState?: {
    activeMatchesByUser: Map<string, string>;
    socketsByUser: Map<string, ArenaWebSocket>;
    usersInWaitingRoom: Set<string>;
  };
};

const getArenaWsState = () => {
  if (!globalForArenaWs.__arenaWsState) {
    globalForArenaWs.__arenaWsState = {
      activeMatchesByUser: new Map(),
      socketsByUser: new Map(),
      usersInWaitingRoom: new Set(),
    };
  }

  return globalForArenaWs.__arenaWsState;
};

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

type UpgradeSocket = {
  write: (chunk: string) => unknown;
  destroy: () => unknown;
};

const rejectUpgrade = (
  socket: UpgradeSocket,
  status: 400 | 401 | 403,
  statusText: "Bad Request" | "Unauthorized" | "Forbidden",
) => {
  socket.write(`HTTP/1.1 ${status} ${statusText}\r\n\r\n`);
  socket.destroy();
};

const joinWaitingRoom = (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, activeMatchesByUser, socketsByUser } =
    getArenaWsState();
  const userId = ws.userId;
  if (activeMatchesByUser.has(userId) || usersInWaitingRoom.has(userId)) return;
  usersInWaitingRoom.add(userId);
  socketsByUser.set(userId, ws);

  tryPairUsers(userId);
};

const tryPairUsers = async (currentUserId: string) => {
  const { usersInWaitingRoom, activeMatchesByUser, socketsByUser } =
    getArenaWsState();
  if (usersInWaitingRoom.size < 2) {
    setTimeout(() => {
      socketsByUser.get(currentUserId)?.send(
        JSON.stringify({
          type: "no_matches_found",
        }),
      );
    }, 4000);
    return;
  }

  try {
    const [dev1, dev2] = usersInWaitingRoom.values();

    usersInWaitingRoom.delete(dev1);
    usersInWaitingRoom.delete(dev2);

    const match = await db.transaction(async (tx) => {
      const [match] = await tx
        .insert(MatchTable)
        .values({
          status: "in-progress",
        })
        .returning();

      if (!match) {
        throw new Error("Failed to create match.");
      }

      const createdMatchUsers = await tx
        .insert(UserMatchTable)
        .values([
          {
            userId: dev1,
            matchId: match.id,
          },
          {
            userId: dev2,
            matchId: match.id,
          },
        ])
        .returning();

      if (createdMatchUsers.length !== 2) {
        throw new Error("Failed to add users to match.");
      }

      return match;
    });

    const matchId = match.id;

    activeMatchesByUser.set(dev1, matchId);
    activeMatchesByUser.set(dev2, matchId);

    socketsByUser.get(dev1)?.send(
      JSON.stringify({
        type: "match_found",
        matchId,
        opponentId: dev2,
      }),
    );

    socketsByUser.get(dev2)?.send(
      JSON.stringify({
        type: "match_found",
        matchId,
        opponentId: dev1,
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

const leaveWaitingRoom = (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, socketsByUser } = getArenaWsState();
  const userId = ws.userId;
  usersInWaitingRoom.delete(userId);
  socketsByUser.delete(userId);
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
      authedWs.userId = session.user.id;

      wss.emit("connection", authedWs, request);
    });
  });

  wss.on("connection", (ws: ArenaWebSocket, _request) => {
    console.log("client connected");

    ws.isAlive = true;
    ws.on("error", console.error);
    ws.on("pong", () => (ws.isAlive = true));

    ws.on("message", (data) => {
      try {
        const json = JSON.parse(data.toString());
        const result = clientMessageSchema.safeParse(json);

        if (!result.success) {
          throw new Error("Invalid message format: ", json);
        }

        const message = result.data;

        const messageType = message.type;

        switch (messageType) {
          case "join_waiting_room":
            joinWaitingRoom(ws);
            break;
          case "leave_waiting_room":
            leaveWaitingRoom(ws);
            break;
          default:
            throw new Error(
              `Invalid message type: ${messageType satisfies never}`,
            );
        }
      } catch (error) {
        console.error(error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format.",
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log("client disconnected");

      // FOR TESING PURPOSES: PLEASE REMOVE LATER
      socketsByUser.delete(ws.userId);
      console.log("USER SOCKETS CLEARED");
      activeMatchesByUser.delete(ws.userId);
      console.log("ACTIVE MATCHES CLEARED");
      usersInWaitingRoom.delete(ws.userId);
      console.log("WAITING ROOM CLEARED");
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((originalWs) => {
      const ws = originalWs as ArenaWebSocket;
      if (!ws.isAlive) {
        activeMatchesByUser.delete(ws.userId);
        socketsByUser.delete(ws.userId);
        usersInWaitingRoom.delete(ws.userId);
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
