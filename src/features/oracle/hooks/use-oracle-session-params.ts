import {
  programmingLanguages,
  oracleSessionStatuses,
  oracleSessionModes,
} from "@/db/shared";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { ORACLE_SESSIONS_SORT_BY_OPTIONS } from "../lib/params";

export const useOracleSessionParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
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
    },
    { shallow: false },
  );
};
