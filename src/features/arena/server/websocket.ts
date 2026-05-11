import { db } from "@/db/db";
import {
  MatchTable,
  UserSettingsTable,
  UserMatchTable,
  ArenaProblemTable,
} from "@/db/schema";
import { ProgrammingLanguageType } from "@/db/shared";
import { auth } from "@/lib/auth/auth";
import { eq } from "drizzle-orm";
import { Server as HttpServer, IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import z from "zod";
import { ServerMessage, UserInfo } from "../lib/types";

export type ArenaSocketServer = HttpServer & {
  // todo: note that you might have to switch to https in prod
  arenaWss?: WebSocketServer;
  arenaWsInitialized?: boolean;
};

type ArenaWebSocket = WebSocket & {
  isAlive: boolean;
  user: UserInfo;
};

type UpgradeSocket = {
  write: (chunk: string) => unknown;
  destroy: () => unknown;
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
    usersInWaitingRoom: Map<
      string,
      UserInfo & { userSettings: typeof UserSettingsTable.$inferSelect }
    >;
  };
};

const getArenaWsState = () => {
  if (!globalForArenaWs.__arenaWsState) {
    globalForArenaWs.__arenaWsState = {
      activeMatchesByUser: new Map(),
      socketsByUser: new Map(),
      usersInWaitingRoom: new Map(),
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

const sendToClient = (message: ServerMessage, ws?: ArenaWebSocket) => {
  if (!ws) return;

  ws.send(JSON.stringify(message));
};

const rejectUpgrade = (
  socket: UpgradeSocket,
  status: 400 | 401 | 403,
  statusText: "Bad Request" | "Unauthorized" | "Forbidden",
) => {
  socket.write(`HTTP/1.1 ${status} ${statusText}\r\n\r\n`);
  socket.destroy();
};

const joinWaitingRoom = async (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, activeMatchesByUser, socketsByUser } =
    getArenaWsState();
  const userId = ws.user.id;

  const [userSettings] = await db
    .select()
    .from(UserSettingsTable)
    .where(eq(UserSettingsTable.userId, userId));
  if (!userSettings) {
    sendToClient(
      {
        type: "no_user_settings",
      },
      ws,
    );
    return;
  }

  if (activeMatchesByUser.has(userId) || usersInWaitingRoom.has(userId)) return;
  usersInWaitingRoom.set(userId, { ...ws.user, userSettings });
  socketsByUser.set(userId, ws);

  tryPairUsers(userId, userSettings.preferredLanguage);
};

const tryPairUsers = async (
  currentUserId: string,
  preferredLanguage: ProgrammingLanguageType,
) => {
  const { usersInWaitingRoom, activeMatchesByUser, socketsByUser } =
    getArenaWsState();
  if (usersInWaitingRoom.size < 2) {
    setTimeout(() => {
      sendToClient(
        {
          type: "no_matches_found",
        },
        socketsByUser.get(currentUserId),
      );
    }, 4000);
    return;
  }
  if (
    !usersInWaitingRoom
      .values()
      .find(
        (user) =>
          user.userSettings.preferredLanguage === preferredLanguage &&
          user.id !== currentUserId,
      )
  ) {
    sendToClient(
      {
        type: "no_matches_found",
      },
      socketsByUser.get(currentUserId),
    );
    return;
  }
  const [dev1, dev2] = usersInWaitingRoom.values();
  const devSockets = [
    { dev: dev1, ws: socketsByUser.get(dev1.id), opponent: dev2 },
    { dev: dev2, ws: socketsByUser.get(dev2.id), opponent: dev1 },
  ];
  try {
    devSockets.forEach((devSocket) => {
      usersInWaitingRoom.delete(devSocket.dev.id);
    });

    const [arenaProblem] = await db
      .select()
      .from(ArenaProblemTable)
      .where(eq(ArenaProblemTable.programmingLanguage, preferredLanguage))
      .limit(1);
    if (!arenaProblem) {
      devSockets.forEach((devSocket) => {
        sendToClient(
          {
            type: "no_problems_found",
          },
          devSocket.ws,
        );
      });
      return;
    }

    const match = await db.transaction(async (tx) => {
      const [match] = await tx
        .insert(MatchTable)
        .values({
          status: "in-progress",
          problemId: arenaProblem.id,
        })
        .returning();

      if (!match) {
        throw new Error("Failed to create match.");
      }

      const createdMatchUsers = await tx
        .insert(UserMatchTable)
        .values(
          devSockets.map((devSocket) => ({
            userId: devSocket.dev.id,
            matchId: match.id,
          })),
        )
        .returning();

      if (createdMatchUsers.length !== 2) {
        throw new Error("Failed to add users to match.");
      }

      return match;
    });

    const matchId = match.id;

    devSockets.forEach((devSocket) => {
      activeMatchesByUser.set(devSocket.dev.id, matchId);
      sendToClient(
        {
          type: "match_found",
          matchId,
          opponent: devSocket.opponent,
        },
        devSocket.ws,
      );
    });
  } catch (error) {
    console.error(error);
    devSockets.forEach((devSocket) => {
      sendToClient(
        {
          type: "error",
          message: "Failed to find match and pair users.",
        },
        devSocket.ws,
      );
    });
  }
};

const leaveWaitingRoom = (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, socketsByUser } = getArenaWsState();
  const userId = ws.user.id;
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

    ws.on("message", async (data) => {
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
            await joinWaitingRoom(ws);
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
        sendToClient(
          {
            type: "error",
            message: "Invalid message format.",
          },
          ws,
        );
      }
    });

    ws.on("close", () => {
      const userId = ws.user.id;
      console.log("client disconnected");

      // FOR TESING PURPOSES: PLEASE REMOVE LATER
      socketsByUser.delete(userId);
      console.log("USER SOCKETS CLEARED");
      activeMatchesByUser.delete(userId);
      console.log("ACTIVE MATCHES CLEARED");
      usersInWaitingRoom.delete(userId);
      console.log("WAITING ROOM CLEARED");
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
