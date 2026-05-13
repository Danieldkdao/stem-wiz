import { WebSocketServer, WebSocket } from "ws";
import { ARENA_WAITING_SOCKET_MESSAGE_TYPES } from "./constants";
import { Server as HttpServer } from "http";
import { UserSettingsTable } from "@/db/schema";
import z from "zod";
import { clientMessageSchema } from "./schemas";
import { MatchServerMessage } from "@/features/matches/lib/types";

export type UserInfo = {
  id: string;
  name: string;
  image?: string | null | undefined;
  // todo: add elo later
};

export type ActiveUser = {
  matchId: string;
  isConnected: boolean;
};

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type ServerMessage = ArenaWaitingServerMessage | MatchServerMessage;

export type ArenaWaitingServerMessage =
  | {
      type: (typeof ARENA_WAITING_SOCKET_MESSAGE_TYPES)["match_found"];
      matchId: string;
      opponent: UserInfo;
    }
  | { type: (typeof ARENA_WAITING_SOCKET_MESSAGE_TYPES)["no_matches_found"] }
  | { type: (typeof ARENA_WAITING_SOCKET_MESSAGE_TYPES)["no_problems_found"] }
  | { type: (typeof ARENA_WAITING_SOCKET_MESSAGE_TYPES)["no_user_settings"] }
  | {
      type: (typeof ARENA_WAITING_SOCKET_MESSAGE_TYPES)["error"];
      message: string;
    };

export type ArenaWaitingServerMessageType = ArenaWaitingServerMessage["type"];

export type ArenaSocketServer = HttpServer & {
  // todo: note that you might have to switch to https in prod
  arenaWss?: WebSocketServer;
  arenaWsInitialized?: boolean;
};

export type ArenaWebSocket = WebSocket & {
  isAlive: boolean;
  user: UserInfo;
};

export type UpgradeSocket = {
  write: (chunk: string) => unknown;
  destroy: () => unknown;
};

export type WaitingRoomUser = UserInfo & {
  userSettings: typeof UserSettingsTable.$inferSelect;
};
