import {
  ArenaProblemTable,
  ChatMessageTable,
  MatchTable,
  UserMatchTable,
} from "@/db/schema";
import { MatchResultReasonType } from "@/db/shared";
import { User } from "@/lib/auth/auth";

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
  | {
      type: "users_connection_statuses";
      users: { userId: string; isConnected: boolean }[];
    }
  | {
      type: "observable_match_count_updated";
      payload:
        | {
            type: "added";
            match: typeof MatchTable.$inferSelect & {
              arenaProblem: typeof ArenaProblemTable.$inferSelect;
              users: (typeof UserMatchTable.$inferSelect & { user: User })[];
            };
          }
        | { type: "removed"; matchId: string };
    }
  | {
      type: "match_observer_count_updated";
      matchId: string;
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
  | {
      type: "new_chat_message";
      message: typeof ChatMessageTable.$inferSelect & { user: User };
    }
  | { type: "observer_running_code"; userId: string }
  | { type: "user_submitted_code"; userId: string }
  | { type: "match_finished"; matchId: string; reason: MatchResultReasonType };
export type MatchObserverServerMessageType = MatchObserverServerMessage["type"];
