import { oracleSessionModes } from "@/db/shared";
import z from "zod";

export const oracleSessionCreationSchema = z.object({
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
  additionalInformation: z.string().optional(),
});
export type OracleSessionCreationSchemaType = z.infer<
  typeof oracleSessionCreationSchema
>;
