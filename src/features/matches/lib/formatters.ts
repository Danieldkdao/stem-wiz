import { ArenaProblemConfigTable, ProblemTable } from "@/db/schema";
import {
  FriendMatchRequestStatusType,
  MatchResultReasonType,
  ProblemSourceType,
} from "@/db/shared";
import {
  UserMatchesFilterByOptionType,
  UserMatchesResultOptionType,
  UserMatchesSortByOptionType,
} from "./params";
import { MatchRequestFilterByOptionType } from "./match-request-params";

export const formatMatchResultReason = (reason: MatchResultReasonType) => {
  switch (reason) {
    case "timeout":
      return "Timeout";
    case "traditional":
      return "Traditional";
    case "user_lost_connection":
      return "User lost connection";
    case "user_quit":
      return "User quit";
    default:
      throw new Error(`Unknown match result reason: ${reason satisfies never}`);
  }
};

export const formatUserMatchSortByOptions = (
  option: UserMatchesSortByOptionType,
) => {
  switch (option) {
    case "most_recent":
      return "Most recent";
    case "expires_soon":
      return "Expires soon";
    case "oldest":
      return "Oldest";
    default:
      throw new Error(
        `Unknown user match sort by option: ${option satisfies never}`,
      );
  }
};

export const formatUserMatchFilterByOptions = (
  option: UserMatchesFilterByOptionType,
) => {
  switch (option) {
    case "all":
      return "All";
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    default:
      throw new Error(
        `Unknown user match filter by option: ${option satisfies never}`,
      );
  }
};

export const formatUserMatchResultOptions = (
  option: UserMatchesResultOptionType,
) => {
  switch (option) {
    case "lost":
      return "Lost";
    case "no_winner":
      return "No winner";
    case "won":
      return "Won";
    default:
      throw new Error(
        `Unknown user match result option: ${option satisfies never}`,
      );
  }
};

export const mapProblemToArenaProblem = <
  T extends {
    arenaProblem: typeof ArenaProblemConfigTable.$inferSelect;
    problem: typeof ProblemTable.$inferSelect;
  },
>(
  match: T,
) => {
  const { arenaProblem, problem, ...fields } = match;

  return {
    ...fields,
    arenaProblem: {
      ...arenaProblem,
      problem,
    },
  };
};

export const formatProblemSource = (source: ProblemSourceType) => {
  switch (source) {
    case "ai":
      return {
        label: "AI",
        description:
          "An AI will generate a problem for this match based on you and your friend's stats.",
      };
    case "system":
      return {
        label: "System",
        description:
          "A problem that was preloaded into our system will be used.",
      };
    case "user":
      return {
        label: "User",
        description:
          "You can select a problem from the list created by the community.",
      };
    default:
      throw new Error(`Unknown problem source: ${source satisfies never}`);
  }
};

export const formatMatchRequestFilterByOptions = (
  option: MatchRequestFilterByOptionType,
) => {
  switch (option) {
    case "all":
      return "All";
    case "received":
      return "Received";
    case "sent":
      return "Sent";
    default:
      throw new Error(
        `Unknown match request filter by option: ${option satisfies never}`,
      );
  }
};

export const formatMatchRequestStatus = (
  status: FriendMatchRequestStatusType,
) => {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    case "pending":
      return "Pending";
    case "rejected":
      return "Rejected";
    default:
      throw new Error(
        `Unknown match request status: ${status satisfies never}`,
      );
  }
};

export const formatDateStringWithAgo = (dateString: string) => {
  return dateString
    .split(" ")
    .filter((word) => word !== "ago")
    .join(" ") + " ago";
};
