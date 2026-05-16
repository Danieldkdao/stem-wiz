export type MatchServerMessage =
  | {
      type: "opponent_left_match";
    }
  | { type: "opponent_joined_match" }
  | { type: "opponent_submitted_code" }
  | { type: "match_finished" }
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
  | { type: "observer_running_code"; userId: string };
export type MatchObserverServerMessageType = MatchObserverServerMessage["type"];
