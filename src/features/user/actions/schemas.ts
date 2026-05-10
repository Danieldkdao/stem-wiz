import { preferredLanguages } from "@/db/schema";
import z from "zod";

export const onboardingSchema = z.object({
  preferredLanguage: z.enum(preferredLanguages, {
    error: "Please select a preferred language.",
  }),
  additionalInformation: z
    .string()
    .min(10, { error: "Please enter at least 10 characters." })
    .optional(),
});
export type OnboardingSchemaType = z.infer<typeof onboardingSchema>;
