import { OracleSessionModeType, OracleSessionStatusType } from "@/db/shared";
import { OracleSession } from "./types";

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

export const formatProblemCount = (count: number) => {
  return `${count} ${count === 1 ? "problem" : "problems"}`;
};

export const formatSessionDate = (date: Date) => {
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
  return date ? formatSessionDate(date) : fallback;
};

export const formatSessionDuration = (session: OracleSession) => {
  if (!session.startedAt) return "Not started";

  const endTime = session.completedAt?.getTime() ?? Date.now();
  const minutes = Math.max(
    1,
    Math.round((endTime - session.startedAt.getTime()) / 60000),
  );

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
};

export const getStatusSummary = (status: OracleSession["status"]) => {
  switch (status) {
    case "upcoming":
      return "Not started yet";
    case "active":
      return "In progress";
    case "completed":
      return "Completed";
    case "abandoned":
      return "Abandoned";
    default:
      throw new Error(`Unknown session status: ${status satisfies never}`);
  }
};
