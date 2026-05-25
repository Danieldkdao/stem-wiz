import { OracleSessionModeType, OracleSessionStatusType } from "@/db/shared";

export const formatOracleSessionMode = (mode: OracleSessionModeType) => {
  switch (mode) {
    case "debug":
      return "Debug";
    case "guided":
      return "Guided";
    case "interview":
      return "Interview";
    case "review":
      return "Review";
    case "socratic":
      return "Socratic";
    default:
      throw new Error(`Unknown session mode: ${mode satisfies never}`);
  }
};

export const formatOracleSessionStatus = (status: OracleSessionStatusType) => {
  switch (status) {
    case "abandoned":
      return "Abandoned";
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "upcoming":
      return "Upcoming";
    default:
      throw new Error(`Unknown session status: ${status satisfies never}`);
  }
};
