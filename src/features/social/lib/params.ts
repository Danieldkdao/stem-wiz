import {
  programmingLanguages,
  userCollaborationStyles,
  userExperienceLevels,
  userGoals,
  userLookingFor,
  userMeetupPreferences,
} from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import {
  COMMUNITY_FILTER_BY_OPTIONS,
  COMMUNITY_SORT_BY_OPTIONS,
  HAS_GITHUB_URL_FILTER_OPTIONS,
  HAS_LINKEDIN_URL_FILTER_OPTIONS,
  HAS_PORTFOLIO_URL_FILTER_OPTIONS,
  userAvailabilityFilterSchema,
} from "../actions/schemas";

export {
  COMMUNITY_FILTER_BY_OPTIONS,
  COMMUNITY_SORT_BY_OPTIONS,
  HAS_GITHUB_URL_FILTER_OPTIONS,
  HAS_LINKEDIN_URL_FILTER_OPTIONS,
  HAS_PORTFOLIO_URL_FILTER_OPTIONS,
  userAvailabilityFilterSchema,
} from "../actions/schemas";
export type {
  CommunityFilterByOptionType,
  CommunitySortByOptionType,
  HasGithubUrlFilterOptionType,
  HasLinkedinUrlFilterOptionType,
  HasPortfolioUrlFilterOptionType,
} from "../actions/schemas";

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
  userIds: parseAsArrayOf(parseAsString)
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  explanation: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
};

export const loadCommunitySearchParams = createLoader(filterSearchParams);
