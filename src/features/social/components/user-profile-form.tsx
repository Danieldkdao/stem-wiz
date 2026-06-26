"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
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
import { Textarea } from "@/components/ui/textarea";
import {
  programmingLanguages,
  userAvailabilityDays,
  userAvailabilityTimeOfDay,
  userCollaborationStyles,
  userExperienceLevels,
  userGoals,
  userLookingFor,
  userMeetupPreferences,
  UserProfileTable,
} from "@/db/schema";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  FaBullseye,
  FaCalendarDays,
  FaClock,
  FaCode,
  FaGithub,
  FaGlobe,
  FaHandshake,
  FaHourglassHalf,
  FaLink,
  FaLinkedin,
  FaLocationDot,
  FaMedal,
  FaPeopleArrows,
  FaSun,
  FaUserGroup,
  FaUserPen,
} from "react-icons/fa6";
import { toast } from "sonner";
import { upsertUserProfileAction } from "../actions/actions";
import { userProfileSchema, UserProfileSchemaType } from "../actions/schemas";
import {
  formatProgrammingLanguage,
  formatUserAvailabilityDays,
  formatUserAvailabilityTimeOfDay,
  formatUserCollborationStyle,
  formatUserExperienceLevel,
  formatUserGoals,
  formatUserLookingFor,
  formatUserMeetupPreference,
} from "../lib/formatters";

export const UserProfileForm = ({
  userProfile,
}: {
  userProfile?: typeof UserProfileTable.$inferSelect;
}) => {
  const form = useForm<UserProfileSchemaType>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      availability: userProfile?.availability ?? {
        days: [],
        hoursPerWeek: undefined,
        timeOfDay: [],
      },
      bio: userProfile?.bio ?? "",
      collaborationStyle: userProfile?.collaborationStyle ?? undefined,
      experienceLevel: userProfile?.experienceLevel ?? undefined,
      githubUrl: userProfile?.githubUrl ?? "",
      goals: userProfile?.goals ?? [],
      linkedinUrl: userProfile?.linkedinUrl ?? "",
      location: userProfile?.location ?? "",
      lookingFor: userProfile?.lookingFor ?? undefined,
      meetupPreference: userProfile?.meetupPreference ?? undefined,
      portfolioUrl: userProfile?.portfolioUrl ?? "",
      preferredLanguage: userProfile?.preferredLanguage ?? undefined,
      timezone: userProfile?.timezone ?? "",
      yearsProgramming: userProfile?.yearsProgramming ?? undefined,
    },
  });

  const handleUpdateUserProfile = async (data: UserProfileSchemaType) => {
    const response = await upsertUserProfileAction(data);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleUpdateUserProfile)}
      className="flex flex-col gap-4 w-full"
    >
      <Controller
        name="preferredLanguage"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaCode />
              <FieldLabel>Preferred Language</FieldLabel>
            </div>

            <FieldContent>
              <Select {...props} value={value} onValueChange={onChange}>
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select a programming language..." />
                </SelectTrigger>
                <SelectContent>
                  {programmingLanguages.map((lang) => (
                    <SelectItem value={lang} key={lang}>
                      {formatProgrammingLanguage(lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        name="yearsProgramming"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaHourglassHalf />
              <FieldLabel>Years of Programming (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Input
                type="number"
                min={0}
                step={1}
                {...props}
                value={value === undefined || value === null ? "" : value}
                onChange={(e) =>
                  onChange(
                    Number.isInteger(e.target.valueAsNumber)
                      ? Math.abs(e.target.valueAsNumber)
                      : null,
                  )
                }
                className={getInputErrorStyle(fieldState.error)}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="experienceLevel"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaMedal />
              <FieldLabel>Experience Level (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Select
                {...props}
                value={value ?? undefined}
                onValueChange={onChange}
              >
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select your experience level..." />
                </SelectTrigger>
                <SelectContent>
                  {userExperienceLevels.map((level) => (
                    <SelectItem value={level} key={level}>
                      {formatUserExperienceLevel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="timezone"
          control={form.control}
          render={({ field: { value, ...props }, fieldState }) => (
            <Field>
              <div className="flex items-center gap-2">
                <FaGlobe />
                <FieldLabel>Timezone (Optional)</FieldLabel>
              </div>

              <FieldContent>
                <Input
                  {...props}
                  value={value ?? undefined}
                  placeholder="Enter your timezone..."
                  className={getInputErrorStyle(fieldState.error)}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="location"
          control={form.control}
          render={({ field: { value, ...props }, fieldState }) => (
            <Field>
              <div className="flex items-center gap-2">
                <FaLocationDot />
                <FieldLabel>Location (Optional)</FieldLabel>
              </div>

              <FieldContent>
                <Input
                  {...props}
                  value={value ?? undefined}
                  placeholder="Enter your location..."
                  className={getInputErrorStyle(fieldState.error)}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="meetupPreference"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaPeopleArrows />
              <FieldLabel>Meetup Preference (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Select
                {...props}
                value={value ?? undefined}
                onValueChange={onChange}
              >
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select your meetup preference..." />
                </SelectTrigger>
                <SelectContent>
                  {userMeetupPreferences.map((preference) => (
                    <SelectItem value={preference} key={preference}>
                      {formatUserMeetupPreference(preference)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        name="collaborationStyle"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaHandshake />
              <FieldLabel>Collaboration Style (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Select
                {...props}
                value={value ?? undefined}
                onValueChange={onChange}
              >
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select your collaboration style..." />
                </SelectTrigger>
                <SelectContent>
                  {userCollaborationStyles.map((style) => (
                    <SelectItem value={style} key={style}>
                      {formatUserCollborationStyle(style)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        name="lookingFor"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaUserGroup />
              <FieldLabel>Looking For (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Select
                {...props}
                value={value ?? undefined}
                onValueChange={onChange}
              >
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select your experience level..." />
                </SelectTrigger>
                <SelectContent>
                  {userLookingFor.map((lookingFor) => (
                    <SelectItem value={lookingFor} key={lookingFor}>
                      {formatUserLookingFor(lookingFor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="availability.days"
          control={form.control}
          render={({ field: { value, onChange, ...props }, fieldState }) => (
            <Field>
              <div className="flex items-center gap-2">
                <FaCalendarDays />
                <FieldLabel>Available Days (Optional)</FieldLabel>
              </div>

              <FieldContent>
                <MultiSelect
                  values={value}
                  onValuesChange={onChange}
                  {...props}
                >
                  <MultiSelectTrigger
                    className={cn(
                      "w-full",
                      getInputErrorStyle(fieldState.error),
                    )}
                  >
                    <MultiSelectValue placeholder="Select your available days..." />
                  </MultiSelectTrigger>
                  <MultiSelectContent>
                    {userAvailabilityDays.map((day) => (
                      <MultiSelectItem value={day} key={day}>
                        {formatUserAvailabilityDays(day)}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectContent>
                </MultiSelect>
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="availability.timeOfDay"
          control={form.control}
          render={({ field: { value, onChange, ...props }, fieldState }) => (
            <Field>
              <div className="flex items-center gap-2">
                <FaSun />
                <FieldLabel>Available Time of Day (Optional)</FieldLabel>
              </div>

              <FieldContent>
                <MultiSelect
                  values={value}
                  onValuesChange={onChange}
                  {...props}
                >
                  <MultiSelectTrigger
                    className={cn(
                      "w-full",
                      getInputErrorStyle(fieldState.error),
                    )}
                  >
                    <MultiSelectValue placeholder="Select your available time of day..." />
                  </MultiSelectTrigger>
                  <MultiSelectContent>
                    {userAvailabilityTimeOfDay.map((timeOfDay) => (
                      <MultiSelectItem value={timeOfDay} key={timeOfDay}>
                        {formatUserAvailabilityTimeOfDay(timeOfDay)}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectContent>
                </MultiSelect>
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="availability.hoursPerWeek"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaClock />
              <FieldLabel>Hours Per Week (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Input
                type="number"
                min={1}
                step={1}
                {...props}
                value={value === undefined || value === null ? "" : value}
                onChange={(e) =>
                  onChange(
                    Number.isInteger(e.target.valueAsNumber)
                      ? Math.abs(e.target.valueAsNumber)
                      : null,
                  )
                }
                className={getInputErrorStyle(fieldState.error)}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="goals"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaBullseye />
              <FieldLabel>Goals (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <MultiSelect
                values={value ?? []}
                onValuesChange={onChange}
                {...props}
              >
                <MultiSelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <MultiSelectValue placeholder="Select your goals..." />
                </MultiSelectTrigger>
                <MultiSelectContent>
                  {userGoals.map((goal) => (
                    <MultiSelectItem value={goal} key={goal}>
                      {formatUserGoals(goal)}
                    </MultiSelectItem>
                  ))}
                </MultiSelectContent>
              </MultiSelect>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="githubUrl"
        control={form.control}
        render={({ field: { value, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaGithub />
              <FieldLabel>GitHub Url (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Input
                {...props}
                value={value ?? undefined}
                placeholder="Enter your github profile url..."
                className={getInputErrorStyle(fieldState.error)}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="portfolioUrl"
        control={form.control}
        render={({ field: { value, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaLink />
              <FieldLabel>Portfolio Url (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Input
                {...props}
                value={value ?? undefined}
                placeholder="Enter your portfolio url..."
                className={getInputErrorStyle(fieldState.error)}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="linkedinUrl"
        control={form.control}
        render={({ field: { value, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaLinkedin />
              <FieldLabel>LinkedIn Url (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Input
                {...props}
                value={value ?? undefined}
                placeholder="Enter your linkedin url..."
                className={getInputErrorStyle(fieldState.error)}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="bio"
        control={form.control}
        render={({ field: { value, ...props }, fieldState }) => (
          <Field>
            <div className="flex items-center gap-2">
              <FaUserPen />
              <FieldLabel>Bio (Optional)</FieldLabel>
            </div>

            <FieldContent>
              <Textarea
                {...props}
                value={value ?? undefined}
                placeholder="I am a software developer who enjoys working with Python and problem solving."
                className={cn("max-h-32", getInputErrorStyle(fieldState.error))}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button
        className="w-full"
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          Save changes
        </LoadingSwap>
      </Button>
    </form>
  );
};
