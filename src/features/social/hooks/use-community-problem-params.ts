import {
  programmingLanguages,
  difficultyLevels,
  communityProblemStatuses,
} from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

export const useCommunityProblemParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...SORT_BY_OPTIONS])
        .withDefault("most_recent")
        .withOptions({ clearOnDefault: true }),
      languages: parseAsArrayOf(parseAsStringEnum([...programmingLanguages]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      difficulty: parseAsArrayOf(parseAsStringEnum([...difficultyLevels]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      statuses: parseAsArrayOf(parseAsStringEnum([...communityProblemStatuses]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
