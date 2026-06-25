import {
  DifficultyLevelType,
  OracleSessionModeType,
  OracleSessionStatusType,
} from "@/db/shared";
import { cn, getDuration } from "@/lib/utils";
import { OracleSessionsSortByOptionsType } from "./params";
import { OracleSession } from "./types";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { Badge } from "@/components/ui/badge";

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

export const formatOracleSessionSortByOptions = (
  option: OracleSessionsSortByOptionsType,
) => {
  switch (option) {
    case "longest_duration":
      return "Longest duration";
    case "most_problems":
      return "Most problems";
    case "most_recent":
      return "Most recent";
    case "oldest":
      return "oldest";
    case "recently_completed":
      return "Recently completed";
    default:
      throw new Error(
        `Unknown oracle session sort by option: ${option satisfies never}`,
      );
  }
};

export const getDifficultyBadge = (
  difficulty: DifficultyLevelType,
  className?: string,
) => {
  switch (difficulty) {
    case "easy":
      return (
        <Badge
          variant="outline"
          className={cn("text-accent border-accent/50 bg-accent/20", className)}
        >
          {formatDifficultyLevel(difficulty)}
        </Badge>
      );
    case "medium":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-warning border-warning/50 bg-warning/20",
            className,
          )}
        >
          {formatDifficultyLevel(difficulty)}
        </Badge>
      );
    case "hard":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-destructive border-destructive/50 bg-destructive/20",
            className,
          )}
        >
          {formatDifficultyLevel(difficulty)}
        </Badge>
      );
    default:
      throw new Error(
        `Unknown difficulty level: ${difficulty satisfies never}`,
      );
  }
};
