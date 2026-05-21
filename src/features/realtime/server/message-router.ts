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
    console.log("[realtime:router] parsed client message", {
      userId: ws.user.id,
      connectionId: ws.id,
      type: message.type,
    });

    if (arenaClientMessageSchema.safeParse(message).success) {
      console.log("[realtime:router] routing arena message", {
        userId: ws.user.id,
        connectionId: ws.id,
        type: message.type,
      });
      await handleArenaMessage(ws, message);
      return;
    }

    console.log("[realtime:router] unknown message type", {
      userId: ws.user.id,
      connectionId: ws.id,
      type: message.type,
    });
    sendToClient({ type: "error", message: "Unknown message type" }, ws);
  } catch (error) {
    console.error("[realtime:router] failed to handle message", {
      userId: ws.user.id,
      connectionId: ws.id,
      error,
    });
    sendToClient({ type: "error", message: "Invalid message format." }, ws);
  }
};
