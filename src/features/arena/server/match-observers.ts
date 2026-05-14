import { ArenaWebSocket } from "../lib/types";
import { getArenaWsState, sendToUser } from "./connection-state";

export const connectToObservers = (ws: ArenaWebSocket) => {
  const { usersInWaitingRoom, activeMatchesByUser, usersInObservingRoom } =
    getArenaWsState();

  const userId = ws.user.id;

  if (usersInWaitingRoom.has(userId) || activeMatchesByUser.has(userId)) {
    sendToUser(userId, {
      type: "error",
      message:
        "You cannot connect while still being in a match or in the waiting room.",
    });
    return;
  }
  if (usersInObservingRoom.has(userId)) return;

  usersInObservingRoom.add(userId);
};
