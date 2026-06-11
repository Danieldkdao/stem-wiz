import { notificationEventTypes } from "@/db/shared";
import z from "zod";

const notificationClientEventSchema = z.object({
  type: z.enum(notificationEventTypes),
  notificationId: z.uuid(),
});
export type NotificationClientEventType = z.infer<
  typeof notificationClientEventSchema
>;

export const notificationClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("new_notification"),
    event: notificationClientEventSchema,
  }),
]);
export type NotificationClientMessage = z.infer<
  typeof notificationClientMessageSchema
>;
