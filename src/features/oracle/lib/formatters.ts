import { OracleSessionModeType } from "@/db/shared";

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
