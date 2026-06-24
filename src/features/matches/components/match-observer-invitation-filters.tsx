"use client";

import { SearchInput } from "@/components/search-input";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  matchObserverInvitationStatuses,
  MatchObserverInvitationStatusType,
} from "@/db/shared";
import { SORT_BY_OPTIONS } from "@/lib/constants";
import { SortByType } from "@/lib/types";
import { useMatchObserverInvitationParams } from "../hooks/use-match-observer-invitation-params";
import {
  formatMatchObserverInvitationStatus,
  formatMatchRequestFilterByOptions,
  formatUserMatchSortByOptions,
} from "../lib/formatters";
import {
  MATCH_REQUEST_FILTER_BY_OPTIONS,
  MatchRequestFilterByOptionType,
} from "../lib/match-request-params";

export const MatchObserverInvitationFilters = () => {
  const [filters, setFilters] = useMatchObserverInvitationParams();

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-card rounded-md">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by user name, problem title, description, or concepts..."
        />
      </div>
      <div className="flex items-center gap-2">
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
                statuses: values as MatchObserverInvitationStatusType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by status..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {matchObserverInvitationStatuses.map((status) => (
                <MultiSelectItem key={status} value={status}>
                  {formatMatchObserverInvitationStatus(status)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
      </div>
    </div>
  );
};
