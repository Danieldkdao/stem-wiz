"use client";

import { SearchInput } from "@/components/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFriendChatParams } from "@/features/chats/hooks/use-friend-chat-params";
import {
  FRIEND_CHATS_FILTER_BY_OPTIONS,
  FRIEND_CHATS_SORT_BY_OPTIONS,
  FriendChatsFilterByOptionType,
  FriendChatsSortByOptionType,
} from "@/features/chats/lib/friend-chat-params";
import {
  formatFriendChatFilterByOptions,
  formatFriendChatSortByOptions,
} from "../lib/formatters";

export const CommunityChatFilters = () => {
  const [filters, setFilters] = useFriendChatParams();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md bg-card">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by chat title, friend name, or chat message..."
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-md bg-card">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                sortBy: value as FriendChatsSortByOptionType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {FRIEND_CHATS_SORT_BY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatFriendChatSortByOptions(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md bg-card">
          <Select
            value={filters.filterBy}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                filterBy: value as FriendChatsFilterByOptionType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              {FRIEND_CHATS_FILTER_BY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatFriendChatFilterByOptions(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
