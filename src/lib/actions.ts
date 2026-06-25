"use server";

import { db } from "@/db/db";
import { getCurrentUser } from "./auth/helpers";
import { and, count, eq, gt, isNull, or } from "drizzle-orm";
import {
  FriendMatchRequestTable,
  MatchObserverInvitationTable,
  MatchTable,
  NotificationTable,
  OracleSessionTable,
  UserMatchTable,
} from "@/db/schema";

export const getDashboardCardInfoAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [totalActiveMatches] = await db
    .select({
      count: count(),
    })
    .from(UserMatchTable)
    .innerJoin(MatchTable, eq(MatchTable.id, UserMatchTable.matchId))
    .where(
      and(
        eq(UserMatchTable.userId, userId),
        eq(MatchTable.status, "in-progress"),
        or(gt(MatchTable.expiresAt, new Date()), isNull(MatchTable.expiresAt)),
      ),
    );

  const [totalPendingMatchRequests] = await db
    .select({
      count: count(),
    })
    .from(FriendMatchRequestTable)
    .where(
      and(
        or(
          eq(FriendMatchRequestTable.recipientUserId, userId),
          eq(FriendMatchRequestTable.requesterUserId, userId),
        ),
        isNull(FriendMatchRequestTable.respondedAt),
        eq(FriendMatchRequestTable.status, "pending"),
        or(
          isNull(FriendMatchRequestTable.expiresAt),
          gt(FriendMatchRequestTable.expiresAt, new Date()),
        ),
      ),
    );
  const [totalPendingMatchInvitations] = await db
    .select({ count: count() })
    .from(MatchObserverInvitationTable)
    .innerJoin(
      MatchTable,
      eq(MatchTable.id, MatchObserverInvitationTable.matchId),
    )
    .where(
      and(
        or(
          eq(MatchObserverInvitationTable.invitedUserId, userId),
          eq(MatchObserverInvitationTable.inviterUserId, userId),
        ),
        eq(MatchObserverInvitationTable.status, "pending"),
        or(
          gt(MatchTable.expiresAt, new Date()),
          isNull(MatchTable.expiresAt),
          eq(MatchTable.status, "in-progress"),
        ),
      ),
    );

  const [totalActiveUpcommingOracleSessions] = await db
    .select({ count: count() })
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.userId, userId),
        or(
          eq(OracleSessionTable.status, "upcoming"),
          eq(OracleSessionTable.status, "active"),
        ),
        isNull(OracleSessionTable.completedAt),
      ),
    );

  const [totalUnreadNotifications] = await db
    .select({ count: count() })
    .from(NotificationTable)
    .where(
      and(
        eq(NotificationTable.userId, userId),
        isNull(NotificationTable.readAt),
      ),
    );

  return {
    activeMatchCount: totalActiveMatches.count,
    pendingMatchInvitationCount:
      totalPendingMatchInvitations.count + totalPendingMatchRequests.count,
    oracleSessionCount: totalActiveUpcommingOracleSessions.count,
    unreadNotificationCount: totalUnreadNotifications.count,
  };
};
