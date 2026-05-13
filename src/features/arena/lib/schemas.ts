import z from "zod";

export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join_waiting_room"),
  }),
  z.object({
    type: z.literal("leave_waiting_room"),
  }),
  z.object({
    type: z.literal("connect_to_match"),
    matchId: z.uuid(),
  }),
]);
