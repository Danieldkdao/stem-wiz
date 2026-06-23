"use client";

import { SearchInput } from "@/components/search-input";
import { useMatchRequestsParams } from "../hooks/use-match-request-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortByType } from "@/lib/types";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import {
  formatMatchRequestFilterByOptions,
  formatMatchRequestStatus,
  formatUserMatchSortByOptions,
} from "../lib/formatters";
import {
  MATCH_REQUEST_FILTER_BY_OPTIONS,
  MatchRequestFilterByOptionType,
} from "../lib/match-request-params";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  friendMatchRequestStatuses,
  FriendMatchRequestStatusType,
} from "@/db/shared";

export const MatchRequestFilters = () => {
  const [filters, setFilters] = useMatchRequestsParams();

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-card rounded-md">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by friend name, problem title, description, or concepts..."
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="bg-card rounded-md">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              setFilters({ ...filters, sortBy: value as SortByType })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_BY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatUserMatchSortByOptions(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-md">
          <Select
            value={filters.filterBy}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                filterBy: value as MatchRequestFilterByOptionType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              {MATCH_REQUEST_FILTER_BY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatMatchRequestFilterByOptions(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-md">
          <MultiSelect
            values={filters.statuses}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                statuses: values as FriendMatchRequestStatusType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by statuses..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {friendMatchRequestStatuses.map((status) => (
                <MultiSelectItem key={status} value={status}>
                  {formatMatchRequestStatus(status)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
      </div>
    </div>
  );
};
