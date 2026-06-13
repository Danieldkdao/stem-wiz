import { matchResultReasons } from "@/db/shared";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import {
  USER_MATCHES_SORT_BY_OPTIONS,
  USER_MATCHES_FILTER_BY_OPTIONS,
  USER_MATCHES_RESULT_OPTIONS,
} from "../lib/params";

export const useUserMatchParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...USER_MATCHES_SORT_BY_OPTIONS])
        .withDefault("most_recent")
        .withOptions({ clearOnDefault: true }),
      filterBy: parseAsStringEnum([...USER_MATCHES_FILTER_BY_OPTIONS])
        .withDefault("all")
        .withOptions({ clearOnDefault: true }),
      results: parseAsArrayOf(
        parseAsStringEnum([...USER_MATCHES_RESULT_OPTIONS]),
      )
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      completionReasons: parseAsArrayOf(
        parseAsStringEnum([...matchResultReasons]),
      )
        .withDefault([])
        .withOptions({
          clearOnDefault: true,
        }),
    },
    { shallow: false },
  );
};
