import { matchObserverInvitationStatuses } from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { MATCH_REQUEST_FILTER_BY_OPTIONS } from "./match-request-params";

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...SORT_BY_OPTIONS])
    .withDefault("most_recent")
    .withOptions({ clearOnDefault: true }),
  filterBy: parseAsStringEnum([...MATCH_REQUEST_FILTER_BY_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  statuses: parseAsArrayOf(
    parseAsStringEnum([...matchObserverInvitationStatuses]),
  )
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
};
export const loadMatchObserverInvitationSearchParams =
  createLoader(filterSearchParams);
