"use client";

import { SearchInput } from "@/components/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommunityParams } from "../hooks/use-community-params";
import {
  formatCommunityFilterByOptions,
  formatCommunityGithubFilterOptions,
  formatCommunityLinkedinFilterOptions,
  formatCommunityPortfolioFilterOptions,
  formatCommunitySortByOptions,
  formatProgrammingLanguage,
  formatUserAvailabilityDays,
  formatUserAvailabilityTimeOfDay,
  formatUserCollborationStyle,
  formatUserExperienceLevel,
  formatUserGoals,
  formatUserLookingFor,
  formatUserMeetupPreference,
} from "../lib/formatters";
import {
  COMMUNITY_FILTER_BY_OPTIONS,
  COMMUNITY_SORT_BY_OPTIONS,
  CommunityFilterByOptionType,
  CommunitySortByOptionType,
  HAS_GITHUB_URL_FILTER_OPTIONS,
  HAS_LINKEDIN_URL_FILTER_OPTIONS,
  HAS_PORTFOLIO_URL_FILTER_OPTIONS,
  HasGithubUrlFilterOptionType,
  HasLinkedinUrlFilterOptionType,
  HasPortfolioUrlFilterOptionType,
} from "../lib/params";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  programmingLanguages,
  ProgrammingLanguageType,
  userAvailabilityDays,
  UserAvailabilityDayType,
  userAvailabilityTimeOfDay,
  UserAvailabilityTimeOfDayType,
  userCollaborationStyles,
  UserCollaborationStyleType,
  userExperienceLevels,
  UserExperienceLevelType,
  userGoals,
  UserGoalType,
  userLookingFor,
  UserLookingForType,
  userMeetupPreferences,
  UserMeetupPreferenceType,
} from "@/db/shared";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronUpIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export const CommunityFilters = () => {
  const [filters, setFilters] = useCommunityParams();

  const resetFilters = () => {
    setFilters({
      search: "",
      sortBy: "most_recent",
      filterBy: "all",
      preferredLanguages: [],
      meetupPreferences: [],
      lookingFor: [],
      collaborationStyles: [],
      experienceLevels: [],
      goals: [],
      yearsProgrammingLower: null,
      yearsProgrammingUpper: null,
      availability: {
        days: undefined,
        timeOfDay: undefined,
        hoursPerWeekLower: null,
        hoursPerWeekUpper: null,
      },
      hasGithubUrl: "all",
      hasLinkedinUrl: "all",
      hasPortfolioUrl: "all",
      userIds: [],
      explanation: "",
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full rounded-md bg-card">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search for developers..."
        />
      </div>
      <Card>
        <CardContent>
          <Collapsible className="flex flex-col gap-2">
            <CollapsibleTrigger className="w-full flex cursor-pointer items-center gap-2 justify-between flex-wrap group">
              <span className="text-lg font-semibold">Filters</span>
              <ChevronUpIcon className="size-5 group-data-[state=open]:rotate-180 transition-transform duration-300" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-2">
              <Separator />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-base font-medium">Basic</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          sortBy: value as CommunitySortByOptionType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNITY_SORT_BY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatCommunitySortByOptions(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.filterBy}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          filterBy: value as CommunityFilterByOptionType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNITY_FILTER_BY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatCommunityFilterByOptions(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-base font-medium">Profile</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <MultiSelect
                      values={filters.preferredLanguages}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          preferredLanguages:
                            values as ProgrammingLanguageType[],
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by preferred languages..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {programmingLanguages.map((language) => (
                          <MultiSelectItem key={language} value={language}>
                            {formatProgrammingLanguage(language)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <MultiSelect
                      values={filters.experienceLevels}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          experienceLevels: values as UserExperienceLevelType[],
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by experience levels..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {userExperienceLevels.map((level) => (
                          <MultiSelectItem key={level} value={level}>
                            {formatUserExperienceLevel(level)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <MultiSelect
                      values={filters.meetupPreferences}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          meetupPreferences:
                            values as UserMeetupPreferenceType[],
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by meetup preferences..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {userMeetupPreferences.map((preference) => (
                          <MultiSelectItem key={preference} value={preference}>
                            {formatUserMeetupPreference(preference)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <MultiSelect
                      values={filters.collaborationStyles}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          collaborationStyles:
                            values as UserCollaborationStyleType[],
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by collaboration styles..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {userCollaborationStyles.map((style) => (
                          <MultiSelectItem key={style} value={style}>
                            {formatUserCollborationStyle(style)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <MultiSelect
                      values={filters.lookingFor}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          lookingFor: values as UserLookingForType[],
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by looking for..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {userLookingFor.map((lookingFor) => (
                          <MultiSelectItem key={lookingFor} value={lookingFor}>
                            {formatUserLookingFor(lookingFor)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <MultiSelect
                      values={filters.goals}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          goals: values as UserGoalType[],
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by goals..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {userGoals.map((goal) => (
                          <MultiSelectItem key={goal} value={goal}>
                            {formatUserGoals(goal)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="w-full flex items-center gap-2 justify-between flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground">
                        Years programming
                      </span>
                      <span className="text-sm font-medium">
                        {filters.yearsProgrammingLower ?? 0} -{" "}
                        {filters.yearsProgrammingUpper ?? 100}
                      </span>
                    </div>
                    <Slider
                      value={[
                        filters.yearsProgrammingLower ?? 0,
                        filters.yearsProgrammingUpper ?? 100,
                      ]}
                      onValueChange={(values) =>
                        setFilters({
                          ...filters,
                          yearsProgrammingLower: values[0],
                          yearsProgrammingUpper: values[1],
                        })
                      }
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-base font-medium">Availability</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <MultiSelect
                      values={filters.availability.days}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          availability: {
                            ...filters.availability,
                            days: values as UserAvailabilityDayType[],
                          },
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by available days..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {userAvailabilityDays.map((day) => (
                          <MultiSelectItem key={day} value={day}>
                            {formatUserAvailabilityDays(day)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <MultiSelect
                      values={filters.availability.timeOfDay}
                      onValuesChange={(values) =>
                        setFilters({
                          ...filters,
                          availability: {
                            ...filters.availability,
                            timeOfDay:
                              values as UserAvailabilityTimeOfDayType[],
                          },
                        })
                      }
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue placeholder="Filter by available time of day..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {userAvailabilityTimeOfDay.map((timeOfDay) => (
                          <MultiSelectItem key={timeOfDay} value={timeOfDay}>
                            {formatUserAvailabilityTimeOfDay(timeOfDay)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2 w-full justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Hours per week
                      </span>
                      <span className="text-sm font-medium">
                        {filters.availability.hoursPerWeekLower ?? 0} -{" "}
                        {filters.availability.hoursPerWeekUpper ?? 168}
                      </span>
                    </div>
                    <Slider
                      value={[
                        filters.availability.hoursPerWeekLower ?? 0,
                        filters.availability.hoursPerWeekUpper ?? 168,
                      ]}
                      onValueChange={(values) =>
                        setFilters({
                          ...filters,
                          availability: {
                            ...filters.availability,
                            hoursPerWeekLower: values[0],
                            hoursPerWeekUpper: values[1],
                          },
                        })
                      }
                      max={168}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-base font-medium">Social</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={filters.hasLinkedinUrl}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          hasLinkedinUrl:
                            value as HasLinkedinUrlFilterOptionType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Linkedin url..." />
                      </SelectTrigger>
                      <SelectContent>
                        {HAS_LINKEDIN_URL_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatCommunityLinkedinFilterOptions(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.hasPortfolioUrl}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          hasPortfolioUrl:
                            value as HasPortfolioUrlFilterOptionType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by portfolio url..." />
                      </SelectTrigger>
                      <SelectContent>
                        {HAS_PORTFOLIO_URL_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatCommunityPortfolioFilterOptions(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.hasGithubUrl}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          hasGithubUrl: value as HasGithubUrlFilterOptionType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Github url..." />
                      </SelectTrigger>
                      <SelectContent>
                        {HAS_GITHUB_URL_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatCommunityGithubFilterOptions(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="w-full mt-2"
              >
                Reset filters
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
};
