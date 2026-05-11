import { SOCKET_RESPONSE_TYPES } from "./constants";

export type UserInfo = {
  id: string;
  name: string;
  image?: string | null | undefined;
  // todo: add elo later
};

export type ServerMessage =
  | {
      type: (typeof SOCKET_RESPONSE_TYPES)["match_found"];
      matchId: string;
      opponent: UserInfo;
    }
  | { type: (typeof SOCKET_RESPONSE_TYPES)["no_matches_found"] }
  | { type: (typeof SOCKET_RESPONSE_TYPES)["no_problems_found"] }
  | { type: (typeof SOCKET_RESPONSE_TYPES)["no_user_settings"] }
  | {
      type: (typeof SOCKET_RESPONSE_TYPES)["error"];
      message: string;
    };
