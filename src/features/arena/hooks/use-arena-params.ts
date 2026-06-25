import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

export const useArenaParams = () => {
  return useQueryStates(
    {
      defaultTab: parseAsStringEnum(["friend-challenge", "random-pairing"])
        .withDefault("random-pairing")
        .withOptions({ clearOnDefault: true }),
      selectedProblemId: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      problemTitle: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
