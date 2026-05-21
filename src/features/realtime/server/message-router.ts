import { arenaClientMessageSchema } from "@/features/arena/lib/schemas";
import { realtimeClientMessageSchema } from "../lib/schemas";
import { RealtimeWebSocket } from "../lib/types";
import { sendToClient } from "./connection-state";
import { handleArenaMessage } from "@/features/arena/server/handle-arena-message";

export const handleRealtimeMessage = async (
  ws: RealtimeWebSocket,
  data: Buffer,
) => {
  try {
    const json = JSON.parse(data.toString());
    const result = realtimeClientMessageSchema.safeParse(json);

    if (!result.success) {
      sendToClient({ type: "error", message: "Invalid message format." }, ws);
      return;
    }

    const message = result.data;

    if (arenaClientMessageSchema.safeParse(message).success) {
      await handleArenaMessage(ws, message);
      return;
    }

    sendToClient({ type: "error", message: "Unknown message type" }, ws);
  } catch (error) {
    console.error(error);
    sendToClient({ type: "error", message: "Invalid message format." }, ws);
  }
};
