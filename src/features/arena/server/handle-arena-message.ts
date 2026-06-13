import { RealtimeWebSocket } from "@/features/realtime/lib/types";
import { ArenaClientMessage } from "../lib/schemas";
import { broadcastChatMessageSent } from "./chats";
import {
  broadcastCodeOutput,
  broadcastCodeSnapshot,
  broadcastRunningCode,
  broadcastUserSubmittedCode,
  connectToObservers,
  leaveObserverMatch,
  subscribeObserverMatch,
} from "./match-observers";
import {
  broadcastCodeSubmission,
  connectToMatch,
  finishMatchFromSocket,
} from "./match-realtime";
import { joinWaitingRoom, leaveWaitingRoom } from "./matchmaking";

export const handleArenaMessage = async (
  ws: RealtimeWebSocket,
  message: ArenaClientMessage,
) => {
  const messageType = message.type;

  switch (messageType) {
    case "join_waiting_room":
      await joinWaitingRoom(ws);
      break;
    case "leave_waiting_room":
      leaveWaitingRoom(ws);
      break;
    case "connect_to_match":
      await connectToMatch(ws, message.matchId);
      break;
    case "submitted_code":
      await broadcastCodeSubmission(ws, message.matchId);
      break;
    case "connect_to_observers":
      connectToObservers(ws);
      break;
    case "subscribe_observer_match":
      await subscribeObserverMatch(ws, message.matchId);
      break;
    case "code_snapshot":
      await broadcastCodeSnapshot(ws, message.matchId, message.code);
      break;
    case "output_snapshot":
      await broadcastCodeOutput(
        ws,
        message.matchId,
        message.output,
        message.error,
      );
      break;
    case "running_code":
      await broadcastRunningCode(ws, message.matchId);
      break;
    case "user_submitted_code":
      await broadcastUserSubmittedCode(ws, message.matchId);
      break;
    case "match_finished":
      await finishMatchFromSocket(ws, message.matchId, message.reason);
      break;
    case "chat_message_sent":
      await broadcastChatMessageSent(ws, message.matchId, message);
      break;
    case "leave_observer_match":
      await leaveObserverMatch(ws, message.matchId);
      break;
    default:
      throw new Error(`Invalid message type: ${messageType satisfies never}`);
  }
};
