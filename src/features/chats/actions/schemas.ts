import z from "zod";

export const chatInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { error: "Please enter some input before sending." }),
});
export type ChatInputSchemaType = z.infer<typeof chatInputSchema>;

export const friendChatSchema = z.object({
  title: z.string().trim().min(1, { error: "Please enter a title" }).nullish(),
  friendRequestId: z.uuid({ error: "Please select a friend to chat with" }),
});
export type FriendChatSchemaType = z.infer<typeof friendChatSchema>;
