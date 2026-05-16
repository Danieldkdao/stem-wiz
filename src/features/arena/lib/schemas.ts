import { matchResultReasons } from "@/db/shared";
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
  z.object({
    type: z.literal("submitted_code"),
    matchId: z.uuid(),
  }),
  z.object({
    type: z.literal("connect_to_observers"),
  }),
  z.object({
    type: z.literal("subscribe_observer_match"),
    matchId: z.uuid(),
  }),
  z.object({
    type: z.literal("code_snapshot"),
    matchId: z.uuid(),
    code: z.string(),
  }),
  z.object({
    type: z.literal("output_snapshot"),
    matchId: z.uuid(),
    error: z.string().optional().nullable(),
    output: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal("running_code"),
    matchId: z.uuid(),
  }),
  z.object({
    type: z.literal("user_submitted_code"),
    matchId: z.uuid(),
  }),
  z.object({
    type: z.literal("match_finished"),
    matchId: z.uuid(),
    reason: z.enum(matchResultReasons),
  }),
]);
