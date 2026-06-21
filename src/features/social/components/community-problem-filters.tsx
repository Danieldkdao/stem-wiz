"use client";

import { SearchInput } from "@/components/search-input";
import { useCommunityProblemParams } from "../hooks/use-community-problem-params";
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
  formatCommunityProblemStatus,
  formatCommunitySortByOptions,
  formatProgrammingLanguage,
} from "../lib/formatters";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  communityProblemStatuses,
  CommunityProblemStatusType,
  difficultyLevels,
  DifficultyLevelType,
  programmingLanguages,
  ProgrammingLanguageType,
} from "@/db/shared";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";

export const CommunityProblemFilters = () => {
  const [filters, setFilters] = useCommunityProblemParams();

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-card rounded-md">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by title, description, author name, or concepts..."
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
                  {formatCommunitySortByOptions(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-md">
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
        <div className="bg-card rounded-md">
          <MultiSelect
            values={filters.difficulty}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                difficulty: values as DifficultyLevelType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by difficulty level..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {difficultyLevels.map((level) => (
                <MultiSelectItem key={level} value={level}>
                  {formatDifficultyLevel(level)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
        <div className="bg-card rounded-md">
          <MultiSelect
            values={filters.statuses}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                statuses: values as CommunityProblemStatusType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by status..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {communityProblemStatuses.map((status) => (
                <MultiSelectItem key={status} value={status}>
                  {formatCommunityProblemStatus(status).label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
      </div>
    </div>
  );
};
