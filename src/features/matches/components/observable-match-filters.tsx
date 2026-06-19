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
import { programmingLanguages, ProgrammingLanguageType } from "@/db/shared";
import { useObservableMatchParams } from "@/features/matches/hooks/use-observable-match-params";
import { formatUserMatchSortByOptions } from "@/features/matches/lib/formatters";
import { USER_MATCHES_SORT_BY_OPTIONS } from "@/features/matches/lib/params";
import { formatProgrammingLanguage } from "../../social/lib/formatters";

export const ObservableMatchFilters = () => {
  const [filters, setFilters] = useObservableMatchParams();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md bg-card">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by participant name..."
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-md bg-card">
          <Select value={filters.sortBy}>
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
        <div className="rounded-md bg-card">
          <MultiSelect
            values={filters.languages}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                languages: values as ProgrammingLanguageType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by programming language..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {programmingLanguages.map((language) => (
                <MultiSelectItem key={language} value={language}>
                  {formatProgrammingLanguage(language)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
      </div>
    </div>
  );
};
