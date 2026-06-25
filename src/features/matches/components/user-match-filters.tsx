"use client";

import { SearchInput } from "@/components/search-input";
import { useUserMatchParams } from "../hooks/use-user-match-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  USER_MATCHES_FILTER_BY_OPTIONS,
  USER_MATCHES_KIND_OPTIONS,
  USER_MATCHES_RESULT_OPTIONS,
  USER_MATCHES_SORT_BY_OPTIONS,
  UserMatchesFilterByOptionType,
  UserMatchesKindOptionType,
  UserMatchesResultOptionType,
  UserMatchesSortByOptionType,
} from "../lib/params";
import {
  formatMatchResultReason,
  formatUserMatchFilterByOptions,
  formatUserMatchKindOptions,
  formatUserMatchResultOptions,
  formatUserMatchSortByOptions,
} from "../lib/formatters";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { matchResultReasons, MatchResultReasonType } from "@/db/shared";

export const UserMatchFilters = () => {
  const [filters, setFilters] = useUserMatchParams();

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-card rounded-md">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by opponent name..."
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="bg-card rounded-md">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                sortBy: value as UserMatchesSortByOptionType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {USER_MATCHES_SORT_BY_OPTIONS.map((option) => (
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
                filterBy: value as UserMatchesFilterByOptionType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              {USER_MATCHES_FILTER_BY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatUserMatchFilterByOptions(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-md">
          <MultiSelect
            values={filters.results}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                results: values as UserMatchesResultOptionType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by match results..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {USER_MATCHES_RESULT_OPTIONS.map((option) => (
                <MultiSelectItem key={option} value={option}>
                  {formatUserMatchResultOptions(option)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
        <div className="bg-card rounded-md">
          <MultiSelect
            values={filters.completionReasons}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                completionReasons: values as MatchResultReasonType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by completion reasons..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {...matchResultReasons.map((reason) => (
                <MultiSelectItem key={reason} value={reason}>
                  {formatMatchResultReason(reason)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
        <div className="rounded-md bg-card">
          <Select
            value={filters.kind}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                kind: value as UserMatchesKindOptionType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by kind..." />
            </SelectTrigger>
            <SelectContent>
              {USER_MATCHES_KIND_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatUserMatchKindOptions(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
