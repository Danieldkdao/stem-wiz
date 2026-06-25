import { db } from "@/db/db";
import {
  ChatTable,
  CommunityProblemTable,
  FriendMatchRequestTable,
  FriendRequestTable,
  MatchObserverInvitationTable,
  MatchObserverTable,
  MatchTable,
  UserMatchTable,
} from "@/db/schema";
import {
  FriendMatchRequestStatusType,
  NotificationPayloadEvent,
} from "@/db/shared";
import { findActiveFriendshipById } from "@/features/friends/server/friendships";
import { NOT_FOUND_ERROR_MESSAGE } from "@/lib/constants";
import {
  and,
  eq,
  getTableColumns,
  gt,
  isNotNull,
  isNull,
  or,
  SQL,
} from "drizzle-orm";

export const handleRespondFriendRequestEvent = async (
  event: NotificationPayloadEvent<
    "friend_request_accepted" | "friend_request_rejected"
  >,
) => {
  const isAcceptedEvent = event.type === "friend_request_accepted";

  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, event.friendRequestId),
        eq(
          FriendRequestTable.toUserId,
          isAcceptedEvent ? event.acceptedByUserId : event.rejectedByUserId,
        ),
        eq(
          FriendRequestTable.status,
          isAcceptedEvent ? "accepted" : "rejected",
        ),
        isNotNull(FriendRequestTable.respondedAt),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Friend request not found.");
  }

  return existingFriendRequest.fromUserId;
};

export const handleFriendRequestSentEvent = async (
  event: NotificationPayloadEvent<"friend_request_sent">,
) => {
  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, event.friendRequestId),
        eq(FriendRequestTable.fromUserId, event.fromUserId),
        eq(FriendRequestTable.status, "pending"),
        isNull(FriendRequestTable.respondedAt),
      ),
    );

  if (!existingFriendRequest) {
    throw new Error("Received friend request not found.");
  }

  return existingFriendRequest.toUserId;
};

export const handleFriendChatEvent = async (
  event: NotificationPayloadEvent<"new_chat" | "chat_deleted">,
) => {
  const eventType = event.type;
  const userId = event.userId;

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, event.chatId));

  if (eventType === "chat_deleted") {
    if (existingChat) {
      throw new Error("Chat not deleted.");
    } else {
      return userId;
    }
  }

  if (!existingChat || !existingChat.friendshipId) {
    throw new Error("Chat not found.");
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) return null;

  return existingFriendship.friend.id;
};

export const handleCommunityProblemEvent = async (
  userId: string,
  event: NotificationPayloadEvent<
    "community_problem_access_revoked" | "community_problem_shared_with_you"
  >,
) => {
  const [existingCommunityProblem] = await db
    .select()
    .from(CommunityProblemTable)
    .where(
      and(
        eq(CommunityProblemTable.id, event.communityProblemId),
        eq(CommunityProblemTable.authorUserId, userId),
      ),
    );
  if (!existingCommunityProblem) throw new Error(NOT_FOUND_ERROR_MESSAGE);

  const existingFriendship = await findActiveFriendshipById(
    event.friendshipId,
    userId,
  );
  if (!existingFriendship) throw new Error("Friendship not established.");

  return existingFriendship.friend.id;
};

export const handleCommunityProblemDeletedEvent = async (
  userId: string,
  event: NotificationPayloadEvent<"community_problem_deleted">,
) => {
  const existingFriendship = await findActiveFriendshipById(
    event.friendshipId,
    userId,
  );
  if (!existingFriendship)
    throw new Error("Failed to find existing active friendship.");

  return existingFriendship.friend.id;
};

export const handleNewMatchRequest = async (
  userId: string,
  payload: NotificationPayloadEvent<"new_match_request">,
) => {
  const existingFriendship = await findActiveFriendshipById(
    payload.friendshipId,
    userId,
  );
  if (!existingFriendship) throw new Error("No active friendship found.");

  const [existingMatchRequest] = await db
    .select()
    .from(FriendMatchRequestTable)
    .where(
      and(
        eq(FriendMatchRequestTable.id, payload.matchRequestId),
        eq(FriendMatchRequestTable.friendshipId, existingFriendship.id),
        eq(FriendMatchRequestTable.requesterUserId, userId),
        eq(
          FriendMatchRequestTable.recipientUserId,
          existingFriendship.friend.id,
        ),
        or(
          isNull(FriendMatchRequestTable.expiresAt),
          gt(FriendMatchRequestTable.expiresAt, new Date()),
        ),
      ),
    );
  if (!existingMatchRequest)
    throw new Error("Failed to find existing match request.");

  return existingFriendship.friend.id;
};

export const handleMatchRequestCancelled = async (
  userId: string,
  payload: NotificationPayloadEvent<"match_request_cancelled">,
) => {
  const { matchRequestId, friendshipId } = payload;

  const [existingMatchRequest] = await db
    .select()
    .from(FriendMatchRequestTable)
    .where(
      and(
        eq(FriendMatchRequestTable.id, matchRequestId),
        eq(FriendMatchRequestTable.friendshipId, friendshipId),
        eq(FriendMatchRequestTable.requesterUserId, userId),
        eq(FriendMatchRequestTable.status, "cancelled"),
      ),
    );
  if (!existingMatchRequest) throw new Error("Match request not found.");

  return existingMatchRequest.recipientUserId;
};

export const handleMatchRequestResponse = async (
  userId: string,
  payload: NotificationPayloadEvent<
    "match_request_accepted" | "match_request_rejected"
  >,
) => {
  const { matchRequestId, friendshipId } = payload;

  const [existingMatchRequest] = await db
    .select()
    .from(FriendMatchRequestTable)
    .where(
      and(
        eq(FriendMatchRequestTable.id, matchRequestId),
        payload.type === "match_request_accepted"
          ? isNotNull(FriendMatchRequestTable.matchId)
          : undefined,
        eq(FriendMatchRequestTable.friendshipId, friendshipId),
        eq(FriendMatchRequestTable.recipientUserId, userId),
        eq(
          FriendMatchRequestTable.status,
          payload.type.replace(
            "match_request_",
            "",
          ) as FriendMatchRequestStatusType,
        ),
      ),
    );
  if (!existingMatchRequest) throw new Error("Match request not found.");

  return existingMatchRequest.requesterUserId;
};

export const handleNewMatchObserverInvitation = async (
  userId: string,
  payload: NotificationPayloadEvent<"new_match_observer_invitation">,
) => {
  const { matchId, matchObserverInvitationId } = payload;
  const [existingUserMatch] = await db
    .select({
      ...getTableColumns(UserMatchTable),
      match: getTableColumns(MatchTable),
    })
    .from(UserMatchTable)
    .innerJoin(MatchTable, eq(MatchTable.id, UserMatchTable.matchId))
    .where(
      and(
        eq(UserMatchTable.matchId, matchId),
        eq(UserMatchTable.userId, userId),
        eq(MatchTable.status, "in-progress"),
        eq(MatchTable.kind, "friend_challenge"),
        or(isNull(MatchTable.expiresAt), gt(MatchTable.expiresAt, new Date())),
      ),
    );
  if (!existingUserMatch) throw new Error("User match not found.");

  const [existingInvitation] = await db
    .select()
    .from(MatchObserverInvitationTable)
    .where(
      and(
        eq(MatchObserverInvitationTable.id, matchObserverInvitationId),
        eq(MatchObserverInvitationTable.matchId, existingUserMatch.matchId),
        eq(MatchObserverInvitationTable.inviterUserId, userId),
      ),
    );
  if (!existingInvitation) throw new Error("Invitation not found.");

  return existingInvitation.invitedUserId;
};

export const handleMatchObserverInvitationAction = async (
  userId: string,
  payload: NotificationPayloadEvent<
    | "match_observer_invitation_accepted"
    | "match_observer_invitation_rejected"
    | "match_observer_invitation_revoked"
  >,
) => {
  const { matchId, matchObserverInvitationId } = payload;

  const statusMap: Record<
    typeof payload.type,
    {
      directionQuery: (SQL<unknown> | undefined)[];
      fieldToReturn: Extract<
        keyof typeof MatchObserverInvitationTable.$inferSelect,
        "inviterUserId" | "invitedUserId"
      >;
    }
  > = {
    match_observer_invitation_accepted: {
      directionQuery: [
        eq(MatchObserverInvitationTable.invitedUserId, userId),
        eq(MatchObserverInvitationTable.status, "accepted"),
      ],
      fieldToReturn: "inviterUserId",
    },
    match_observer_invitation_rejected: {
      directionQuery: [
        eq(MatchObserverInvitationTable.invitedUserId, userId),
        eq(MatchObserverInvitationTable.status, "rejected"),
      ],
      fieldToReturn: "inviterUserId",
    },
    match_observer_invitation_revoked: {
      directionQuery: [
        eq(MatchObserverInvitationTable.inviterUserId, userId),
        eq(MatchObserverInvitationTable.status, "revoked"),
      ],
      fieldToReturn: "invitedUserId",
    },
  };

  const statusMapResult = statusMap[payload.type];

  const [existingMatchObserverInvitation] = await db
    .select()
    .from(MatchObserverInvitationTable)
    .where(
      and(
        eq(MatchObserverInvitationTable.id, matchObserverInvitationId),
        eq(MatchObserverInvitationTable.matchId, matchId),
        isNotNull(MatchObserverInvitationTable.respondedAt),
        ...statusMapResult.directionQuery,
      ),
    );
  if (!existingMatchObserverInvitation)
    throw new Error("Match observer invitation not found.");

  if (payload.type === "match_observer_invitation_accepted") {
    const [existingMatchObserver] = await db
      .select()
      .from(MatchObserverTable)
      .where(
        and(
          eq(MatchObserverTable.userId, userId),
          eq(
            MatchObserverTable.matchId,
            existingMatchObserverInvitation.matchId,
          ),
        ),
      );
    if (!existingMatchObserver) throw new Error("Match observer not found.");
  }

  return existingMatchObserverInvitation[statusMapResult.fieldToReturn];
};
