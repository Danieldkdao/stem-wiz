import { programmingLanguages, userExperienceLevels } from "@/db/shared";
import z from "zod";

export const onboardingSchema = z.object({
  preferredLanguage: z.enum(programmingLanguages, {
    error: "Please select a preferred language.",
  }),
  experienceLevel: z.enum(userExperienceLevels),
});
export type OnboardingSchemaType = z.infer<typeof onboardingSchema>;
