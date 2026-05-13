export const ARENA_WAITING_SOCKET_MESSAGE_TYPES = {
  match_found: "match_found",
  no_matches_found: "no_matches_found",
  no_problems_found: "no_problems_found",
  no_user_settings: "no_user_settings",
  error: "error",
} as const;

export const MATCH_SOCKET_MESSAGE_TYPES = {
  opponent_left_match: "opponent_left_match",
  opponent_joined_match: "opponent_joined_match",
} as const;
