import { programmingLanguages } from "@/db/shared";
import z from "zod";

export const problemSources = ["ai", "user"] as const;
export const friendMatchRequestSchema = z
  .object({
    problemSource: z.enum(problemSources),
    problemId: z
      .uuid({ error: "Please select a problem." })
      .optional()
      .nullable(),
    prompt: z
      .string()
      .max(300, { error: "No more than 300 characters." })
      .optional()
      .nullable(),
    recipientFriendshipId: z.uuid({
      error: "Please choose a friend to challenge.",
    }),
    programmingLanguage: z.enum(programmingLanguages).optional().nullable(),
    timeLimit: z
      .number({
        error:
          "Please enter a positive integer that between or equal to 300 and 10800.",
      })
      .int({
        error:
          "Please enter a positive integer that between or equal to 300 and 10800.",
      })
      .positive({
        error:
          "Please enter a positive integer that between or equal to 300 and 10800.",
      })
      .min(300, {
        error:
          "Please enter a positive integer that between or equal to 300 and 10800.",
      })
      .max(10800, {
        error:
          "Please enter a positive integer that between or equal to 300 and 10800.",
      })
      .optional()
      .nullable(),
    expiresAt: z
      .date({ error: "Please select a valid date." })
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.problemSource === "user" && !data.problemId) {
      ctx.addIssue({
        code: "custom",
        path: ["problemId"],
        message: "Please select a problem.",
      });
    }
    if (data.problemSource === "ai" && !data.programmingLanguage) {
      ctx.addIssue({
        code: "custom",
        path: ["programmingLanguage"],
        message: "Please select a programming language.",
      });
    }
  });
export type FriendMatchRequestSchemaType = z.infer<
  typeof friendMatchRequestSchema
>;
