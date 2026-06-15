import { SORT_BY_OPTIONS } from "@/lib/constants";
import { createLoader, parseAsString, parseAsStringEnum } from "nuqs/server";

export const FRIEND_CHATS_SORT_BY_OPTIONS = [
  ...SORT_BY_OPTIONS,
  "most_recent_activity",
  "oldest_activity",
  "most_messages",
  "friend_name",
] as const;
export type FriendChatsSortByOptionType =
  (typeof FRIEND_CHATS_SORT_BY_OPTIONS)[number];

export const FRIEND_CHATS_FILTER_BY_OPTIONS = [
  "all",
  "has_messages",
  "empty",
] as const;
export type FriendChatsFilterByOptionType =
  (typeof FRIEND_CHATS_FILTER_BY_OPTIONS)[number];

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...FRIEND_CHATS_SORT_BY_OPTIONS])
    .withDefault("most_recent")
    .withOptions({ clearOnDefault: true }),
  filterBy: parseAsStringEnum([...FRIEND_CHATS_FILTER_BY_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
};
export const loadFriendChatSearchParams = createLoader(filterSearchParams);
