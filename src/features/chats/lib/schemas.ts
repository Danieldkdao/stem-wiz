import z from "zod";

export const friendChatClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("connect_to_friend_chat"),
    chatId: z.uuid(),
  }),
  z.object({
    type: z.literal("new_message"),
    messageId: z.uuid(),
  }),
  z.object({
    type: z.literal("updated_message"),
    messageId: z.uuid(),
  }),
  z.object({
    type: z.literal("deleted_message"),
    messageId: z.uuid(),
  }),
  z.object({
    type: z.literal("updated_chat"),
    chatId: z.uuid(),
  }),
  z.object({
    type: z.literal("deleted_chat"),
    chatId: z.uuid(),
  }),
]);
export type FriendChatClientMessage = z.infer<
  typeof friendChatClientMessageSchema
>;
