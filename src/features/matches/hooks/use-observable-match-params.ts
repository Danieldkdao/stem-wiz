import { programmingLanguages } from "@/db/shared";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import {
  USER_MATCHES_KIND_OPTIONS,
  USER_MATCHES_SORT_BY_OPTIONS,
} from "../lib/params";

export const useObservableMatchParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...USER_MATCHES_SORT_BY_OPTIONS])
        .withDefault("most_recent")
        .withOptions({ clearOnDefault: true }),
      languages: parseAsArrayOf(parseAsStringEnum([...programmingLanguages]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      kind: parseAsStringEnum([...USER_MATCHES_KIND_OPTIONS])
        .withDefault("all")
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
