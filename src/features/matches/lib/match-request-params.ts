import { friendMatchRequestStatuses } from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const MATCH_REQUEST_FILTER_BY_OPTIONS = [
  "all",
  "received",
  "sent",
] as const;
export type MatchRequestFilterByOptionType =
  (typeof MATCH_REQUEST_FILTER_BY_OPTIONS)[number];

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...SORT_BY_OPTIONS])
    .withDefault("most_recent")
    .withOptions({ clearOnDefault: true }),
  filterBy: parseAsStringEnum([...MATCH_REQUEST_FILTER_BY_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  statuses: parseAsArrayOf(parseAsStringEnum([...friendMatchRequestStatuses]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
};
export const loadMatchRequestSearchParams = createLoader(filterSearchParams);
