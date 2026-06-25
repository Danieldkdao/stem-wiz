import { matchResultReasons } from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const USER_MATCHES_SORT_BY_OPTIONS = [
  ...SORT_BY_OPTIONS,
  "expires_soon",
] as const;
export type UserMatchesSortByOptionType =
  (typeof USER_MATCHES_SORT_BY_OPTIONS)[number];

export const USER_MATCHES_FILTER_BY_OPTIONS = [
  "all",
  "completed",
  "in_progress",
] as const;
export type UserMatchesFilterByOptionType =
  (typeof USER_MATCHES_FILTER_BY_OPTIONS)[number];

export const USER_MATCHES_RESULT_OPTIONS = [
  "won",
  "lost",
  "no_winner",
] as const;
export type UserMatchesResultOptionType =
  (typeof USER_MATCHES_RESULT_OPTIONS)[number];

export const USER_MATCHES_KIND_OPTIONS = [
  "all",
  "arena",
  "friend_challenge",
] as const;
export type UserMatchesKindOptionType =
  (typeof USER_MATCHES_KIND_OPTIONS)[number];

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...USER_MATCHES_SORT_BY_OPTIONS])
    .withDefault("most_recent")
    .withOptions({ clearOnDefault: true }),
  filterBy: parseAsStringEnum([...USER_MATCHES_FILTER_BY_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  results: parseAsArrayOf(parseAsStringEnum([...USER_MATCHES_RESULT_OPTIONS]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  completionReasons: parseAsArrayOf(parseAsStringEnum([...matchResultReasons]))
    .withDefault([])
    .withOptions({
      clearOnDefault: true,
    }),
  kind: parseAsStringEnum([...USER_MATCHES_KIND_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
};
export const loadUserMatchSearchParams = createLoader(filterSearchParams);
