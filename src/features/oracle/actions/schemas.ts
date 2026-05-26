import { oracleSessionModes, programmingLanguages } from "@/db/shared";
import z from "zod";

export const oracleSessionActionSchema = z.object({
  title: z
    .string()
    .trim()
    .max(100, { error: "Cannot be longer than 100 characters." })
    .optional(),
  description: z.string().optional(),
  programmingLanguage: z.enum(programmingLanguages, {
    error: "Please select a programming language for this session.",
  }),
  numberOfProblems: z
    .number({
      error:
        "Must be a positive integer greater than 0, but no greater than 5.",
    })
    .int({
      error:
        "Must be a positive integer greater than 0, but no greater than 5.",
    })
    .positive({
      error:
        "Must be a positive integer greater than 0, but no greater than 5.",
    })
    .min(1, {
      error:
        "Must be a positive integer greater than 0, but no greater than 5.",
    })
    .max(5, { error: "Cannot be greater than 5." }),
  mode: z.enum(oracleSessionModes, { error: "Please select a mode." }),
  additionalInstructions: z.string().optional(),
});
export type OracleSessionActionSchemaType = z.infer<
  typeof oracleSessionActionSchema
>;
