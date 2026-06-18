import { ArenaProblemConfigTable, ProblemTable } from "@/db/schema";
import { MatchResultReasonType } from "@/db/shared";
import {
  UserMatchesFilterByOptionType,
  UserMatchesResultOptionType,
  UserMatchesSortByOptionType,
} from "./params";

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
