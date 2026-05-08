import { NextApiRequest, NextApiResponse } from "next";
import { Socket } from "node:net";
import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer, IncomingMessage } from "node:http";
import { auth } from "@/lib/auth/auth";
import z from "zod";
import { db } from "@/db/db";
import { MatchTable } from "@/db/schemas/match";

export const config = {
  api: {
    bodyParser: false,
  },
};

type SocketWithServer = Socket & {
  // todo: might have to double check this in prod with https
  server: HttpServer & {
    wss?: WebSocketServer;
  };
};

type NextApiResponseWithSocket = NextApiResponse & {
  socket: SocketWithServer;
};

type ExtendedWebSocket = WebSocket & {
  isAlive: boolean;
  userId: string;
};

type UpgradeSocket = {
  write: (chunk: string) => unknown;
  destroy: () => unknown;
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

const rejectUpgrade = (
  socket: UpgradeSocket,
  status: 400 | 401 | 403,
  statusText: "Bad Request" | "Unauthorized" | "Forbidden",
) => {
  socket.write(`HTTP/1.1 ${status} ${statusText}\r\n\r\n`);
  socket.destroy();
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

// type ClientMessage = z.infer<typeof clientMessageSchema>

const activeMatchesByUser = new Map<string, string>();
const socketsByUser = new Map<string, ExtendedWebSocket>();
const usersInWaitingRoom = new Set<string>();

const joinWaitingRoom = (ws: ExtendedWebSocket) => {
  const userId = ws.userId;
  if (activeMatchesByUser.has(userId) || usersInWaitingRoom.has(userId)) return;
  usersInWaitingRoom.add(userId);
  socketsByUser.set(userId, ws);

  tryPairUsers();
};

const tryPairUsers = async () => {
  if (usersInWaitingRoom.size < 2) return;

  try {
    const [dev1, dev2] = usersInWaitingRoom.values();

    usersInWaitingRoom.delete(dev1);
    usersInWaitingRoom.delete(dev2);

    const [match] = await db
      .insert(MatchTable)
      .values({
        user1Id: dev1,
        user2Id: dev2,
        status: "in-progress",
      })
      .returning();

    if (!match) {
      throw new Error("Failed to create match.");
    }

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

const handler = async (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  const server = res.socket.server;

  if (!server.wss) {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", async (request, socket, head) => {
      if (!request.url?.startsWith("/api/server")) {
        rejectUpgrade(socket, 400, "Bad Request");
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
        const authedWs = ws as ExtendedWebSocket;

        authedWs.userId = session.user.id;

        wss.emit("connection", authedWs, request);
      });
    });

    wss.on("connection", (ws: ExtendedWebSocket, request) => {
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

          switch (message.type) {
            case "join_waiting_room":
              joinWaitingRoom(ws);
              break;
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
      });
    });

    const interval = setInterval(() => {
      wss.clients.forEach((originalWs) => {
        const ws = originalWs as ExtendedWebSocket;
        if (!ws.isAlive) {
          activeMatchesByUser.delete(ws.userId);
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

    server.wss = wss;
  }
  return res.status(200).json({
    message: "Hey there this is the first api route from pages directory!",
  });
};

export default handler;
