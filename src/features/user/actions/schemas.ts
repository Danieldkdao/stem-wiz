import {
  programmingLanguages,
  userAvailabilityDays,
  userAvailabilityTimeOfDay,
  userCollaborationStyles,
  userExperienceLevels,
  userGoals,
  userLookingFor,
  userMeetupPreferences,
} from "@/db/shared";
import z from "zod";

export const onboardingSchema = z.object({
  preferredLanguage: z.enum(programmingLanguages, {
    error: "Please select a preferred language.",
  }),
  experienceLevel: z.enum(userExperienceLevels),
});
export type OnboardingSchemaType = z.infer<typeof onboardingSchema>;

export const zodNumberValidation = (min = 0) =>
  z
    .number({ error: `Please enter a positive integer greater than ${min}.` })
    .positive({ error: `Please enter a positive integer greater than ${min}.` })
    .int({ error: `Please enter a positive integer greater than ${min}.` })
    .min(min, {
      error: `Please enter a positive integer greater than ${min}.`,
    });

export const userProfileSchema = z.object({
  preferredLanguage: z.enum(programmingLanguages),
  yearsProgramming: zodNumberValidation().optional().nullable(),
  experienceLevel: z.enum(userExperienceLevels).optional().nullable(),
  bio: z
    .string()
    .min(10, { error: "Please enter at least 10 characters." })

    .optional()
    .nullable(),
  timezone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  meetupPreference: z.enum(userMeetupPreferences).optional().nullable(),
  collaborationStyle: z.enum(userCollaborationStyles).optional().nullable(),
  lookingFor: z.enum(userLookingFor).optional().nullable(),
  availability: z
    .object({
      days: z.array(z.enum(userAvailabilityDays)).optional(),
      timeOfDay: z
        .array(z.enum(userAvailabilityTimeOfDay))

        .optional(),
      hoursPerWeek: zodNumberValidation(1).optional(),
    })
    .optional()
    .nullable(),
  goals: z
    .array(z.enum(userGoals))
    .min(1, { error: "Please enter at least one goal." })

    .optional()
    .nullable(),
  githubUrl: z
    .url({ error: "Please enter a a valid url." })
    .optional()
    .nullable(),
  portfolioUrl: z
    .url({ error: "Please enter a a valid url." })
    .optional()
    .nullable(),
  linkedinUrl: z
    .url({ error: "Please enter a a valid url." })
    .optional()
    .nullable(),
});
export type UserProfileSchemaType = z.infer<typeof userProfileSchema>;
