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
