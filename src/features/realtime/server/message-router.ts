import { arenaClientMessageSchema } from "@/features/arena/lib/schemas";
import { realtimeClientMessageSchema } from "../lib/schemas";
import { RealtimeWebSocket } from "../lib/types";
import { sendToClient } from "./connection-state";
import { handleArenaMessage } from "@/features/arena/server/handle-arena-message";
import { notificationClientMessageSchema } from "@/features/notifications/lib/schemas";
import { handleNotificationMessage } from "@/features/notifications/server/handle-notification-message";

export const handleRealtimeMessage = async (
  ws: RealtimeWebSocket,
  data: Buffer,
) => {
  try {
    const json = JSON.parse(data.toString());
    const result = realtimeClientMessageSchema.safeParse(json);

    if (!result.success) {
      sendToClient(ws, { type: "error", message: "Invalid message format." });
      return;
    }

    const message = result.data;

    const arenaResult = arenaClientMessageSchema.safeParse(message);
    if (arenaResult.success) {
      await handleArenaMessage(ws, arenaResult.data);
      return;
    }

    const notificationResult =
      notificationClientMessageSchema.safeParse(message);
    if (notificationResult.success) {
      await handleNotificationMessage(ws, notificationResult.data);
      return;
    }

    sendToClient(ws, { type: "error", message: "Unknown message type" });
  } catch (error) {
    console.error("[realtime:router] failed to handle message", {
      userId: ws.user.id,
      connectionId: ws.id,
      error,
    });
    sendToClient(ws, { type: "error", message: "Invalid message format." });
  }
};
