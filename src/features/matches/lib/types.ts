import { ARENA_WAITING_SOCKET_MESSAGE_TYPES } from "@/features/arena/lib/constants";
import {
  MATCH_SOCKET_MESSAGE_TYPES,
  MATCH_OBSERVE_SOCKET_MESSAGE_TYPES,
} from "./constants";

export type MatchServerMessage =
  | {
      type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_left_match"];
    }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_joined_match"] }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_submitted_code"] }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["match_finished"] }
  | {
      type: (typeof ARENA_WAITING_SOCKET_MESSAGE_TYPES)["error"];
      message: string;
    };

export type MatchServerMessageType = MatchServerMessage["type"];

export type MatchObserverServerMessage =
  | {
      type: (typeof ARENA_WAITING_SOCKET_MESSAGE_TYPES)["error"];
      message: string;
    }
  | {
      type: (typeof MATCH_OBSERVE_SOCKET_MESSAGE_TYPES)["observable_match_count_updated"];
    };
export type MatchObserverServerMessageType = MatchObserverServerMessage["type"];
