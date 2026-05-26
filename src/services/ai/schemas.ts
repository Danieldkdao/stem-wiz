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
