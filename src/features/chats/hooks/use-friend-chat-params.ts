import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import {
  FRIEND_CHATS_SORT_BY_OPTIONS,
  FRIEND_CHATS_FILTER_BY_OPTIONS,
} from "../lib/friend-chat-params";

export const useFriendChatParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...FRIEND_CHATS_SORT_BY_OPTIONS])
        .withDefault("most_recent")
        .withOptions({ clearOnDefault: true }),
      filterBy: parseAsStringEnum([...FRIEND_CHATS_FILTER_BY_OPTIONS])
        .withDefault("all")
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
