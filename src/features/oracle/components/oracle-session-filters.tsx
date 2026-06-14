"use client";

import { SearchInput } from "@/components/search-input";
import { useOracleSessionParams } from "../hooks/use-oracle-session-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ORACLE_SESSIONS_SORT_BY_OPTIONS,
  OracleSessionsSortByOptionsType,
} from "../lib/params";
import {
  formatOracleSessionMode,
  formatOracleSessionSortByOptions,
  formatOracleSessionStatus,
} from "../lib/formatters";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  oracleSessionModes,
  OracleSessionModeType,
  oracleSessionStatuses,
  OracleSessionStatusType,
  programmingLanguages,
  ProgrammingLanguageType,
} from "@/db/shared";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";

export const OracleSessionFilters = () => {
  const [filters, setFilters] = useOracleSessionParams();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md bg-card">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by title, description, or additional information..."
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-md bg-card">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                sortBy: value as OracleSessionsSortByOptionsType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {ORACLE_SESSIONS_SORT_BY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatOracleSessionSortByOptions(option)}
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
              <MultiSelectValue placeholder="Filter by language..." />
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
        <div className="rounded-md bg-card">
          <MultiSelect
            values={filters.statuses}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                statuses: values as OracleSessionStatusType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by status..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {oracleSessionStatuses.map((status) => (
                <MultiSelectItem key={status} value={status}>
                  {formatOracleSessionStatus(status)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
        <div className="rounded-md bg-card">
          <MultiSelect
            values={filters.modes}
            onValuesChange={(values) =>
              setFilters({
                ...filters,
                modes: values as OracleSessionModeType[],
              })
            }
          >
            <MultiSelectTrigger>
              <MultiSelectValue placeholder="Filter by mode..." />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {oracleSessionModes.map((mode) => (
                <MultiSelectItem key={mode} value={mode}>
                  {formatOracleSessionMode(mode)}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
      </div>
    </div>
  );
};
