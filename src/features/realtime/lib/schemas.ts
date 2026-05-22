import z from "zod";
import { arenaClientMessageSchema } from "@/features/arena/lib/schemas";
import { notificationClientMessageSchema } from "@/features/notifications/lib/schemas";

export const realtimeClientMessageSchema = z.discriminatedUnion("type", [
  ...arenaClientMessageSchema.options,
  ...notificationClientMessageSchema.options,
]);

export type RealtimeClientMessage = z.infer<typeof realtimeClientMessageSchema>;
