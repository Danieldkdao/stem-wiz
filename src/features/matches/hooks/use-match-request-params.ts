import { friendMatchRequestStatuses } from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { MATCH_REQUEST_FILTER_BY_OPTIONS } from "../lib/match-request-params";

export const useMatchRequestsParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...SORT_BY_OPTIONS])
        .withDefault("most_recent")
        .withOptions({ clearOnDefault: true }),
      filterBy: parseAsStringEnum([...MATCH_REQUEST_FILTER_BY_OPTIONS])
        .withDefault("all")
        .withOptions({ clearOnDefault: true }),
      statuses: parseAsArrayOf(
        parseAsStringEnum([...friendMatchRequestStatuses]),
      )
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
