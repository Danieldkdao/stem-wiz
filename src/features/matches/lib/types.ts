import { MATCH_SOCKET_MESSAGE_TYPES } from "./constants";

export type MatchServerMessage =
  | {
      type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_left_match"];
    }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_joined_match"] }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_submitted_code"] }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["match_finished"] }
  | {
      type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["match_error"];
      message: string;
    };

export type MatchServerMessageType = MatchServerMessage["type"];
