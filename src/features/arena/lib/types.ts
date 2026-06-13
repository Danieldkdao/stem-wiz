import { UserProfileTable } from "@/db/schema";
import {
  MatchObserverServerMessage,
  MatchServerMessage,
} from "@/features/matches/lib/types";
import { RealtimeUser, RealtimeWebSocket } from "@/features/realtime/lib/types";
import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";

export type ActiveUser = {
  connectionId: string | null;
  matchId: string;
  isConnected: boolean;
};

export type ArenaServerMessage =
  | ArenaWaitingServerMessage
  | MatchServerMessage
  | MatchObserverServerMessage;

export type ArenaWaitingServerMessage =
  | {
      type: "match_found";
      matchId: string;
      opponent: RealtimeUser;
    }
  | {
      type: "active_match_exists";
      matchId: string;
    }
  | { type: "no_matches_found" }
  | { type: "no_problems_found" }
  | { type: "no_user_settings" }
  | {
      type: "error";
      message: string;
    };

export type ArenaWaitingServerMessageType = ArenaWaitingServerMessage["type"];

export type ArenaSocketServer = HttpServer & {
  // todo: note that you might have to switch to https in prod
  arenaWss?: WebSocketServer;
  arenaWsInitialized?: boolean;
};

export type ArenaWebSocket = RealtimeWebSocket;

export type WaitingRoomUser = RealtimeUser & {
  userSettings: typeof UserProfileTable.$inferSelect;
  connectionId: string;
};

export type ActiveObserver = {
  matchId: string;
  connectionId: string;
};
