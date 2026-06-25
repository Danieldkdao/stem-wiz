import { programmingLanguages } from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import {
  USER_MATCHES_KIND_OPTIONS,
  USER_MATCHES_SORT_BY_OPTIONS,
} from "./params";

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...USER_MATCHES_SORT_BY_OPTIONS])
    .withDefault("most_recent")
    .withOptions({ clearOnDefault: true }),
  languages: parseAsArrayOf(parseAsStringEnum([...programmingLanguages]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  kind: parseAsStringEnum([...USER_MATCHES_KIND_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
};
export const loadObservableMatchSearchParams = createLoader(filterSearchParams);
