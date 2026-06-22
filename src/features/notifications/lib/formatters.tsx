import { NotificationPayload, NotificationTable } from "@/db/schema";
import { NotificationListItem } from "./types";
import { RespondFriendRequestButton } from "@/features/friends/components/respond-friend-request-button";
import { LinkButton } from "@/components/link-button";

export const getNotificationListItem = (
  notification: typeof NotificationTable.$inferSelect,
): NotificationListItem => {
  const payloadType = notification.payload.type;
  switch (payloadType) {
    case "friend_request_accepted":
    case "friend_request_rejected":
    case "friend_request_sent":
    case "new_chat":
    case "chat_deleted":
    case "community_problem_shared_with_you":
    case "community_problem_access_revoked":
    case "community_problem_deleted":
    case "new_match_request":
    case "match_request_updated":
    case "match_request_accepted":
    case "match_request_rejected":
      return {
        ...notification,
        title: notification.payload.title,
        message: notification.payload.message,
      };
    case "match_finished":
    case "match_invite":
    case "system":
      // todo: placeholder
      return {
        ...notification,
        title: "Placeholder",
        message: "Placeholder",
      };
    default:
      throw new Error(
        `Unknown notification payload type: ${payloadType satisfies never}`,
      );
  }
};

export const getNotificationChildren = (payload: NotificationPayload) => {
  const payloadType = payload.type;
  switch (payloadType) {
    case "friend_request_sent":
      return (
        <div className="flex items-center gap-2 w-full">
          <RespondFriendRequestButton
            friendRequestId={payload.friendRequestId}
            action="accepted"
            className="flex-1 w-full"
          >
            Accept
          </RespondFriendRequestButton>
          <RespondFriendRequestButton
            friendRequestId={payload.friendRequestId}
            action="rejected"
            variant="destructive"
            className="w-full flex-1"
          >
            Reject
          </RespondFriendRequestButton>
        </div>
      );
    case "new_chat":
      return (
        <LinkButton
          className="w-full"
          href={`/community/chats/${payload.chatId}`}
        >
          View chat
        </LinkButton>
      );
    case "community_problem_shared_with_you":
      return (
        <LinkButton
          className="w-full"
          href={`/community/problems/${payload.communityProblemId}`}
        >
          View problem
        </LinkButton>
      );
    case "new_match_request":
      return (
        <LinkButton
          className="w-full"
          href={`/match-invitations/requests-received/${payload.matchRequestId}`}
        >
          View details
        </LinkButton>
      );
    case "community_problem_deleted":
    case "community_problem_access_revoked":
    case "chat_deleted":
    case "friend_request_accepted":
    case "friend_request_rejected":
    case "match_finished":
    case "match_invite":
    case "system":
      return null;
    default:
      throw new Error(`Unknown payload type: ${payloadType satisfies never}`);
  }
};
