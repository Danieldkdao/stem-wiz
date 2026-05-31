import { pgEnum } from "drizzle-orm/pg-core";

export const programmingLanguages = [
  "python",
  "javascript",
  "java",
  "cpp",
  "typescript",
] as const;
export type ProgrammingLanguageType = (typeof programmingLanguages)[number];
export const programmingLanguageEnum = pgEnum(
  "programming_languages",
  programmingLanguages,
);

export const difficultyLevels = ["easy", "medium", "hard"] as const;
export type DifficultyLevelType = (typeof difficultyLevels)[number];
export const difficultyLevelEnum = pgEnum(
  "difficulty_levels",
  difficultyLevels,
);

export const matchStatuses = ["in-progress", "finished"] as const;
export type MatchStatusType = (typeof matchStatuses)[number];
export const matchStatusEnum = pgEnum("match_statuses", matchStatuses);

export const matchResults = ["completed", "tie"] as const;
export type MatchResultType = (typeof matchResults)[number];
export const matchResultEnum = pgEnum("match_result_results", matchResults);

export const matchResultReasons = [
  "traditional",
  "user_lost_connection",
  "timeout",
  "user_quit",
] as const;
export type MatchResultReasonType = (typeof matchResultReasons)[number];
export const matchResultReasonEnum = pgEnum(
  "match_result_reasons",
  matchResultReasons,
);

export const userExperienceLevels = ["beginner", "junior", "senior"] as const;
export type UserExperienceLevelType = (typeof userExperienceLevels)[number];
export const userExperienceLevelEnum = pgEnum(
  "user_experience_levels",
  userExperienceLevels,
);

export const userMeetupPreferences = ["remote", "in_person", "hybrid"] as const;
export type UserMeetupPreferenceType = (typeof userMeetupPreferences)[number];
export const userMeetupPreferenceEnum = pgEnum(
  "user_meeting_preferences",
  userMeetupPreferences,
);

export const userCollaborationStyles = [
  "pair_programming",
  "async",
  "project_based",
  "study_together",
  "mentorship",
  "brainstorming",
  "code_review",
] as const;
export type UserCollaborationStyleType =
  (typeof userCollaborationStyles)[number];
export const userCollaborationStyleEnum = pgEnum(
  "user_collaboration_styles",
  userCollaborationStyles,
);

export const userLookingFor = [
  "friends",
  "collaborators",
  "mentor",
  "mentee",
  "cofounder",
  "hackathon_team",
  "study_partner",
  "open_source",
  "career_networking",
] as const;
export type UserLookingForType = (typeof userLookingFor)[number];
export const userLookingForEnum = pgEnum("user_looking_for", userLookingFor);

export const userAvailabilityDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type UserAvailabilityDayType = (typeof userAvailabilityDays)[number];
export const userAvailabilityDayEnum = pgEnum(
  "user_availability_days",
  userAvailabilityDays,
);

export const userAvailabilityTimeOfDay = [
  "morning",
  "afternoon",
  "evening",
  "late_night",
] as const;
export type UserAvailabilityTimeOfDayType =
  (typeof userAvailabilityTimeOfDay)[number];
export const userAvailabilityTimeOfDayEnum = pgEnum(
  "user_availability_time_of_day",
  userAvailabilityTimeOfDay,
);

export const userGoals = [
  "learn_new_tech",
  "build_projects",
  "find_collaborators",
  "find_mentors",
  "mentor_others",
  "prepare_for_jobs",
  "join_hackathons",
  "contribute_to_open_source",
  "start_company",
] as const;
export type UserGoalType = (typeof userGoals)[number];
export const userGoalEnum = pgEnum("user_goals", userGoals);

export const friendRequestStatuses = [
  "pending",
  "accepted",
  "rejected",
] as const;
export type FriendRequestStatusType = (typeof friendRequestStatuses)[number];
export const friendRequestStatusEnum = pgEnum(
  "friend_request_statuses",
  friendRequestStatuses,
);

export const notificationEventTypes = [
  "friend_request_sent",
  "friend_request_accepted",
  "match_invite",
  "match_finished",
  "system",
] as const;
export type NotificationEventTypeType = (typeof notificationEventTypes)[number];

export type NotificationPayload =
  | {
      type: "friend_request_sent";
      friendRequestId: string;
      fromUserId: string;
      fromUserName: string;
    }
  | {
      type: "friend_request_accepted";
      friendRequestId: string;
      acceptedByUserId: string;
      acceptedByUserName: string;
    }
  | { type: "match_invite"; matchId: string; fromUserId: string }
  | { type: "match_finished"; matchId: string; winnerId?: string }
  | { type: "system"; title: string; message: string };
export type NotificationPayloadEvent<T extends NotificationPayload["type"]> =
  Extract<NotificationPayload, { type: T }>;

export const oracleSessionStatuses = [
  "upcoming",
  "active",
  "completed",
] as const;
export type OracleSessionStatusType = (typeof oracleSessionStatuses)[number];
export const oracleSessionStatusEnum = pgEnum(
  "oracle_session_statuses",
  oracleSessionStatuses,
);

export const oracleSessionModes = [
  "guided",
  "debug",
  "interview",
  "socratic",
  "review",
] as const;
export type OracleSessionModeType = (typeof oracleSessionModes)[number];
export const oracleSessionModeEnum = pgEnum(
  "oracle_session_modes",
  oracleSessionModes,
);

export const oracleProblemStatuses = ["in-progress", "completed"] as const;
export type OracleProblemStatusType = (typeof oracleProblemStatuses)[number];
export const oracleProblemStatusEnum = pgEnum(
  "oracle_problem_statuses",
  oracleProblemStatuses,
);

export const chatMessageRoles = ["user", "assistant"] as const;
export type ChatMessageRole = (typeof chatMessageRoles)[number];
export const chatMessageRoleEnum = pgEnum(
  "chat_message_roles",
  chatMessageRoles,
);
