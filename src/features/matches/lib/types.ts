import { MatchResultReasonType } from "@/db/shared";

export type MatchServerMessage =
  | {
      type: "opponent_left_match";
    }
  | { type: "opponent_joined_match" }
  | { type: "opponent_submitted_code" }
  | { type: "match_finished"; reason: MatchResultReasonType }
  | {
      type: "error";
      message: string;
    };

export type MatchServerMessageType = MatchServerMessage["type"];

export type MatchObserverServerMessage =
  | {
      type: "error";
      message: string;
    }
  | { type: "connection_error"; message: string }
  | { type: "users_connection_statuses"; userId: string; isConnected: boolean }
  | {
      type: "observable_match_count_updated";
    }
  | {
      type: "match_observer_count_updated";
      newCount: number;
    }
  | {
      type: "observer_code_snapshot";
      userId: string;
      code: string;
    }
  | {
      type: "observer_code_output";
      userId: string;
      output?: string | null;
      error?: string | null;
    }
  | { type: "observer_running_code"; userId: string }
  | { type: "user_submitted_code"; userId: string }
  | { type: "match_finished"; reason: MatchResultReasonType };
export type MatchObserverServerMessageType = MatchObserverServerMessage["type"];
