import { OracleSessionModeType, OracleSessionStatusType } from "@/db/shared";
import { OracleSession } from "./types";
import { getDuration } from "@/lib/utils";

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

export const formatProblemCount = (count: number) => {
  return `${count} ${count === 1 ? "problem" : "problems"}`;
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const formatOptionalSessionDate = (
  date: Date | null,
  fallback: string,
) => {
  return date ? formatDate(date) : fallback;
};

export const formatSessionDuration = (session: OracleSession) => {
  if (!session.startedAt) return "Not started";

  return getDuration(session.startedAt, session.completedAt ?? new Date());
};
