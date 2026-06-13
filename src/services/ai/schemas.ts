import { difficultyLevels } from "@/db/shared";
import z from "zod";

export const oracleProblemSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe(
      "The title for the problem. Should be short and simple, not giving the answer away.",
    ),
  description: z
    .string()
    .min(10)
    .describe(
      "The actual problem including the problem statement and all information about the problem. Make sure this is renderable markdown.",
    ),
  difficulty: z
    .enum(difficultyLevels)
    .describe("The difficulty level of the problem. Decide accordingly."),
  starterCode: z
    .string()
    .min(1)
    .describe(
      "These are coding problems so this is the starter code for the user to begin writing their solution.",
    ),
  solutionOutline: z
    .string()
    .min(10)
    .describe(
      "A detailed solution that clearly explains the whys and the hows.",
    ),
  concepts: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "An array of concepts this problem covers. These should be short (1-2 word/s) and relate to the problem.",
    ),
});

export const oracleProblemFeedbackSchema = z.object({
  feedback: z
    .string()
    .min(1)
    .describe(
      [
        "Renderable markdown feedback for the user's submitted solution.",
        "Do not include the numeric score in this string.",
        "Use these level-two headings exactly once and in order: ## Summary, ## What Worked, ## Needs Work, ## Correctness Notes, ## Code Quality, ## Suggested Revision, ## Next Step.",
      ].join(" "),
    ),
  score: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe(
      "An integer score from 0 to 10 for the user's solution, where 0 is no meaningful attempt and 10 is fully correct, complete, idiomatic, and edge-case aware.",
    ),
});

export const discoverUsersSchema = z.object({
  userIds: z
    .array(z.string().describe("The user id of the user."))
    .describe(
      "The array of recommended user ids. If no quality recommendations can be found, return an empty array.",
    ),
  explanation: z
    .string()
    .min(1)
    .describe(
      "A clear 2-3 sentence explanation of what was found, why these users fit, and how the recommendation was made. If no quality recommendations can be made, explain why in a helpful user-facing way.",
    ),
});
