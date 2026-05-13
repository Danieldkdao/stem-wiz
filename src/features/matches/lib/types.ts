import { MATCH_SOCKET_MESSAGE_TYPES } from "./constants";

export type MatchServerMessage =
  | {
      type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_left_match"];
    }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_joined_match"] }
  | { type: (typeof MATCH_SOCKET_MESSAGE_TYPES)["opponent_submitted_code"] };

export type MatchServerMessageType = MatchServerMessage["type"];
