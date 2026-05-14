export const MATCH_SOCKET_MESSAGE_TYPES = {
  opponent_left_match: "opponent_left_match",
  opponent_joined_match: "opponent_joined_match",
  opponent_submitted_code: "opponent_submitted_code",
  match_finished: "match_finished",
} as const;

export const MATCH_OBSERVE_SOCKET_MESSAGE_TYPES = {
  observable_match_count_updated: "observable_match_count_updated",
} as const;
