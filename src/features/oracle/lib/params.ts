import {
  oracleSessionModes,
  oracleSessionStatuses,
  programmingLanguages,
} from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const ORACLE_SESSIONS_SORT_BY_OPTIONS = [
  ...SORT_BY_OPTIONS,
  "recently_completed",
  "longest_duration",
  "most_problems",
] as const;
export type OracleSessionsSortByOptionsType =
  (typeof ORACLE_SESSIONS_SORT_BY_OPTIONS)[number];

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...ORACLE_SESSIONS_SORT_BY_OPTIONS])
    .withDefault("most_recent")
    .withOptions({ clearOnDefault: true }),
  languages: parseAsArrayOf(parseAsStringEnum([...programmingLanguages]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  statuses: parseAsArrayOf(parseAsStringEnum([...oracleSessionStatuses]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  modes: parseAsArrayOf(parseAsStringEnum([...oracleSessionModes]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
};
export const loadOracleSessionSearchParams = createLoader(filterSearchParams);
