import {
  programmingLanguages,
  userCollaborationStyles,
  userExperienceLevels,
  userGoals,
  userLookingFor,
  userMeetupPreferences,
} from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import z from "zod";
import { userAvailabilityObjectSchema } from "../actions/schemas";

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

export const userAvailabilityFilterSchema = z.object({
  ...userAvailabilityObjectSchema.omit({
    hoursPerWeek: true,
  }).shape,
  hoursPerWeekLower: z.number().int().positive().min(0).optional().nullable(),
  hoursPerWeekUpper: z.number().int().positive().optional().nullable(),
});
export type UserAvailabilityFilterSchemaType = z.infer<
  typeof userAvailabilityFilterSchema
>;

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...COMMUNITY_SORT_BY_OPTIONS])
    .withDefault("most_recent")
    .withOptions({
      clearOnDefault: true,
    }),
  filterBy: parseAsStringEnum([...COMMUNITY_FILTER_BY_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  preferredLanguages: parseAsArrayOf(
    parseAsStringEnum([...programmingLanguages]),
  )
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  yearsProgrammingLower: parseAsInteger.withOptions({ clearOnDefault: true }),
  yearsProgrammingUpper: parseAsInteger.withOptions({ clearOnDefault: true }),
  experienceLevels: parseAsArrayOf(parseAsStringEnum([...userExperienceLevels]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  meetupPreferences: parseAsArrayOf(
    parseAsStringEnum([...userMeetupPreferences]),
  )
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  collaborationStyles: parseAsArrayOf(
    parseAsStringEnum([...userCollaborationStyles]),
  )
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  lookingFor: parseAsArrayOf(parseAsStringEnum([...userLookingFor]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  availability: parseAsJson(userAvailabilityFilterSchema)
    .withDefault({})
    .withOptions({ clearOnDefault: true }),
  goals: parseAsArrayOf(parseAsStringEnum([...userGoals]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  hasGithubUrl: parseAsStringEnum([...HAS_GITHUB_URL_FILTER_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  hasPortfolioUrl: parseAsStringEnum([...HAS_PORTFOLIO_URL_FILTER_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  hasLinkedinUrl: parseAsStringEnum([...HAS_LINKEDIN_URL_FILTER_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
};

export const loadCommunitySearchParams = createLoader(filterSearchParams);
