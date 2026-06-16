import { db } from "@/db/db";
import { MatchTable } from "@/db/schema";
import { MatchResultReasonType } from "@/db/shared";
import { upsertMatchResult } from "@/features/matches/server/match-results";
import { sendToUser } from "@/features/realtime/server/connection-state";
import { and, eq } from "drizzle-orm";
import { getArenaWsState } from "./connection-state";
import { broadcastToMatchObservers } from "./match-observers";

export const finalizeMatch = async ({
  matchId,
  reason,
  winnerId,
}: {
  matchId: string;
  reason: MatchResultReasonType;
  winnerId: string | null;
}) => {
  const { usersInObservingRoom, activeMatchesByUser, usersInWaitingRoom } =
    getArenaWsState();

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
    ),
    with: {
      users: true,
    },
  });

  if (!existingMatch) return null;

  const upsertedResult = await upsertMatchResult({
    matchId: existingMatch.id,
    result: winnerId ? "completed" : "tie",
    winnerId,
    reason,
  });
  if (!upsertedResult) return null;

  existingMatch.users.forEach((user) => {
    sendToUser(user.userId, {
      type: "match_finished",
      reason,
      matchId: existingMatch.id,
    });

    activeMatchesByUser.delete(user.userId);
    usersInWaitingRoom.delete(user.userId);
  });
  await broadcastToMatchObservers(existingMatch.id, {
    type: "match_finished",
    reason,
    matchId: existingMatch.id,
  });

  usersInObservingRoom.forEach((userId) => {
    sendToUser(userId, {
      type: "observable_match_count_updated",
      payload: {
        type: "removed",
        matchId: existingMatch.id,
      },
    });
  });

  return upsertedResult;
};
