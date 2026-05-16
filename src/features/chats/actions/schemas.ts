import z from "zod";

export const chatInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { error: "Please enter some input before sending." }),
});
export type ChatInputSchemaType = z.infer<typeof chatInputSchema>;
