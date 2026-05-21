import z from "zod";
import { arenaClientMessageSchema } from "@/features/arena/lib/schemas";

export const realtimeClientMessageSchema = z.discriminatedUnion("type", [
  ...arenaClientMessageSchema.options,
]);

export type RealtimeClientMessage = z.infer<typeof realtimeClientMessageSchema>;
