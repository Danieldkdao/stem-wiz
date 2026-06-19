import {
  communityProblemStatuses,
  difficultyLevels,
  programmingLanguages,
  userAvailabilityDays,
  userAvailabilityTimeOfDay,
  userCollaborationStyles,
  userExperienceLevels,
  userGoals,
  userLookingFor,
  userMeetupPreferences,
} from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import z from "zod";

export const COMMUNITY_SORT_BY_OPTIONS = [
  ...SORT_BY_OPTIONS,
  "match_count",
  "friend_count",
] as const;
export type CommunitySortByOptionType =
  (typeof COMMUNITY_SORT_BY_OPTIONS)[number];

export const COMMUNITY_FILTER_BY_OPTIONS = [
  "all",
  "pending_friend_requests",
  "friends",
] as const;
export type CommunityFilterByOptionType =
  (typeof COMMUNITY_FILTER_BY_OPTIONS)[number];

export const HAS_GITHUB_URL_FILTER_OPTIONS = [
  "all",
  "has_github_url",
  "no_github_url",
] as const;
export type HasGithubUrlFilterOptionType =
  (typeof HAS_GITHUB_URL_FILTER_OPTIONS)[number];

export const HAS_PORTFOLIO_URL_FILTER_OPTIONS = [
  "all",
  "has_portfolio_url",
  "no_portfolio_url",
] as const;
export type HasPortfolioUrlFilterOptionType =
  (typeof HAS_PORTFOLIO_URL_FILTER_OPTIONS)[number];

export const HAS_LINKEDIN_URL_FILTER_OPTIONS = [
  "all",
  "has_linkedin_url",
  "no_linkedin_url",
] as const;
export type HasLinkedinUrlFilterOptionType =
  (typeof HAS_LINKEDIN_URL_FILTER_OPTIONS)[number];

export const onboardingSchema = z.object({
  preferredLanguage: z.enum(programmingLanguages, {
    error: "Please select a preferred language.",
  }),
  experienceLevel: z.enum(userExperienceLevels),
});
export type OnboardingSchemaType = z.infer<typeof onboardingSchema>;

export const zodNumberValidation = (min = 0) =>
  z
    .number({ error: `Please enter a positive integer greater than ${min}.` })
    .positive({ error: `Please enter a positive integer greater than ${min}.` })
    .int({ error: `Please enter a positive integer greater than ${min}.` })
    .min(min, {
      error: `Please enter a positive integer greater than ${min}.`,
    });

export const userAvailabilityObjectSchema = z.object({
  days: z
    .array(z.enum(userAvailabilityDays))
    .optional()
    .describe(
      "Days of the week when the user is available. Use an empty array or omit this when day availability is not part of the search.",
    ),
  timeOfDay: z
    .array(z.enum(userAvailabilityTimeOfDay))
    .optional()
    .describe(
      "Times of day when the user is available. Use an empty array or omit this when time-of-day availability is not part of the search.",
    ),
  hoursPerWeek: zodNumberValidation(1)
    .optional()
    .describe(
      "The user's available hours per week. This is used on profiles, not AI discovery filters.",
    ),
});

export const userAvailabilitySchema = userAvailabilityObjectSchema
  .optional()
  .nullable();
export type UserAvailabilitySchemaType = z.infer<typeof userAvailabilitySchema>;

export const userAvailabilityFilterSchema = z.object({
  ...userAvailabilityObjectSchema.omit({
    hoursPerWeek: true,
  }).shape,
  hoursPerWeekLower: z
    .number()
    .int()
    .min(0)
    .optional()
    .nullable()
    .describe(
      "Minimum available hours per week for matching users. Use null or omit when there is no lower bound.",
    ),
  hoursPerWeekUpper: z
    .number()
    .int()
    .min(0)
    .optional()
    .nullable()
    .describe(
      "Maximum available hours per week for matching users. Use null or omit when there is no upper bound.",
    ),
});
export type UserAvailabilityFilterSchemaType = z.infer<
  typeof userAvailabilityFilterSchema
>;

export const communityFilterOptionsSchema = z.object({
  search: z
    .string()
    .describe(
      "Free-text search for a user's display name only. Use an empty string unless the request names a specific person.",
    ),
  sortBy: z
    .enum(COMMUNITY_SORT_BY_OPTIONS)
    .describe(
      "Sort order for returned users. Use 'most_recent' by default for broad discovery, 'match_count' for users with more match activity, 'friend_count' for more socially connected users, or 'oldest' only when specifically requested.",
    ),
  filterBy: z
    .enum(COMMUNITY_FILTER_BY_OPTIONS)
    .describe(
      "Relationship filter relative to the current user. Use 'all' for AI discovery unless the user specifically asks for friends or pending friend requests.",
    ),
  preferredLanguages: z
    .array(z.enum(programmingLanguages))
    .describe(
      "Programming languages to match against user profiles. Include values only when the request or current profile clearly points to those languages; otherwise pass an empty array.",
    ),
  yearsProgrammingLower: z
    .number()
    .int()
    .min(0)
    .optional()
    .nullable()
    .describe(
      "Minimum years of programming experience. Use null when no minimum years requirement is needed.",
    ),
  yearsProgrammingUpper: z
    .number()
    .int()
    .min(0)
    .optional()
    .nullable()
    .describe(
      "Maximum years of programming experience. Use null when no maximum years requirement is needed.",
    ),
  experienceLevels: z
    .array(z.enum(userExperienceLevels))
    .describe(
      "Experience levels to match. Use values such as beginner, junior, or senior only when requested or clearly useful; otherwise pass an empty array.",
    ),
  meetupPreferences: z
    .array(z.enum(userMeetupPreferences))
    .describe(
      "Preferred meetup format for matching users. Use remote, in_person, or hybrid when the request mentions meeting style or location needs; otherwise pass an empty array.",
    ),
  collaborationStyles: z
    .array(z.enum(userCollaborationStyles))
    .describe(
      "Collaboration styles to match, such as pair_programming, study_together, mentorship, code_review, brainstorming, async, or project_based. Pass an empty array when not relevant.",
    ),
  lookingFor: z
    .array(z.enum(userLookingFor))
    .describe(
      "What matching users are looking for, such as friends, collaborators, mentor, mentee, cofounder, hackathon_team, study_partner, open_source, or career_networking. Use this for intent matching; otherwise pass an empty array.",
    ),
  availability: userAvailabilityFilterSchema.describe(
    "Availability filters. Use days, timeOfDay, and hour bounds only when the request mentions schedule or availability; otherwise pass an empty object.",
  ),
  goals: z
    .array(z.enum(userGoals))
    .describe(
      "Profile goals to match, such as learn_new_tech, build_projects, find_collaborators, find_mentors, mentor_others, prepare_for_jobs, join_hackathons, contribute_to_open_source, or start_company. Pass an empty array when not relevant.",
    ),
  hasGithubUrl: z
    .enum(HAS_GITHUB_URL_FILTER_OPTIONS)
    .describe(
      "GitHub URL presence filter. Use 'all' by default, 'has_github_url' only when GitHub presence matters, or 'no_github_url' only when specifically requested.",
    ),
  hasPortfolioUrl: z
    .enum(HAS_PORTFOLIO_URL_FILTER_OPTIONS)
    .describe(
      "Portfolio URL presence filter. Use 'all' by default, 'has_portfolio_url' only when portfolio presence matters, or 'no_portfolio_url' only when specifically requested.",
    ),
  hasLinkedinUrl: z
    .enum(HAS_LINKEDIN_URL_FILTER_OPTIONS)
    .describe(
      "LinkedIn URL presence filter. Use 'all' by default, 'has_linkedin_url' only when LinkedIn presence matters, or 'no_linkedin_url' only when specifically requested.",
    ),
  page: z
    .number()
    .int()
    .min(1)
    .describe(
      "Pagination page number. Use 1 for the first tool call; increment only if more results are needed and the previous tool result says there is a next page.",
    ),
  userIds: z
    .array(z.string())
    .describe(
      "Internal exact-user-id filter used by the community page. For AI discovery tool calls, never use this field for searching; always pass an empty array [].",
    ),
});
export type CommunityFilterOptionsSchemaType = z.infer<
  typeof communityFilterOptionsSchema
>;

export const userProfileSchema = z.object({
  preferredLanguage: z.enum(programmingLanguages),
  yearsProgramming: zodNumberValidation().optional().nullable(),
  experienceLevel: z.enum(userExperienceLevels).optional().nullable(),
  bio: z
    .string()
    .min(10, { error: "Please enter at least 10 characters." })

    .optional()
    .nullable(),
  timezone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  meetupPreference: z.enum(userMeetupPreferences).optional().nullable(),
  collaborationStyle: z.enum(userCollaborationStyles).optional().nullable(),
  lookingFor: z.enum(userLookingFor).optional().nullable(),
  availability: userAvailabilitySchema,
  goals: z
    .array(z.enum(userGoals))
    .min(1, { error: "Please enter at least one goal." })

    .optional()
    .nullable(),
  githubUrl: z
    .url({ error: "Please enter a a valid url." })
    .optional()
    .nullable(),
  portfolioUrl: z
    .url({ error: "Please enter a a valid url." })
    .optional()
    .nullable(),
  linkedinUrl: z
    .url({ error: "Please enter a a valid url." })
    .optional()
    .nullable(),
});
export type UserProfileSchemaType = z.infer<typeof userProfileSchema>;

export const communityAiDiscoverSchema = z.object({
  prompt: z.string().trim().min(1, { error: "Please enter a prompt." }),
});
export type CommunityAiDiscoverSchemaType = z.infer<
  typeof communityAiDiscoverSchema
>;

export const communityProblemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Title must be at least one character." }),
  description: z
    .string()
    .trim()
    .min(20, { error: "Description must be longer than 20 characters." }),
  difficultyLevel: z.enum(difficultyLevels),
  programmingLanguage: z.enum(programmingLanguages),
  solution: z
    .string()
    .trim()
    .min(20, { error: "Solution must be longer than 20 characters." }),
  concepts: z
    .array(z.string().min(1))
    .max(5, { error: "You cannot have more than 5 concepts." }),
  status: z.enum(communityProblemStatuses),
  sharedWithUserIds: z.array(z.string().min(1)),
});
export type CommunityProblemSchemaType = z.infer<typeof communityProblemSchema>;
