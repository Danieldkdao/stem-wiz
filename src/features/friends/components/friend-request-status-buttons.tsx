import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Badge } from "@/components/ui/badge";
import { FriendRequestTable, FriendshipTable } from "@/db/schema";
import { CircleQuestionMarkIcon, UserPlusIcon, XIcon } from "lucide-react";
import { FriendRequestButton } from "./friend-request-button";
import { RemovedFriendshipButton } from "./remove-friendship-button";
import { RespondFriendRequestButton } from "./respond-friend-request-button";

export const FriendRequestStatusButtons = ({
  userId,
  existingFriendRequest,
  existingFriendship,
}: {
  userId: string;
  existingFriendRequest: typeof FriendRequestTable.$inferSelect | null;
  existingFriendship: typeof FriendshipTable.$inferSelect | null;
}) => {
  return (
    <TooltipWrapper
      content={
        existingFriendRequest
          ? existingFriendRequest.status === "pending"
            ? existingFriendRequest.toUserId === userId
              ? "Your friend request is pending"
              : "Accept/reject the friend request"
            : existingFriendRequest.status === "accepted"
              ? "Remove your connection with this user"
              : "Send friend request to this user"
          : "Send friend request to this user"
      }
    >
      {existingFriendRequest ? (
        existingFriendRequest.status === "pending" ? (
          existingFriendRequest.toUserId === userId ? (
            <Badge variant="outline">
              <CircleQuestionMarkIcon className="size-4" />
              Pending
            </Badge>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <RespondFriendRequestButton
                  friendRequestId={existingFriendRequest.id}
                  action="accepted"
                >
                  Accept
                </RespondFriendRequestButton>
                <RespondFriendRequestButton
                  friendRequestId={existingFriendRequest.id}
                  action="rejected"
                  variant="destructive"
                >
                  Reject
                </RespondFriendRequestButton>
              </div>
            </>
          )
        ) : existingFriendRequest.status === "accepted" &&
          existingFriendship ? (
          <RemovedFriendshipButton
            variant="destructive"
            friendshipId={existingFriendship.id}
          >
            <XIcon />
            Remove
          </RemovedFriendshipButton>
        ) : (
          <FriendRequestButton userId={userId}>
            <UserPlusIcon className="size-4" />
            Add
          </FriendRequestButton>
        )
      ) : (
        <FriendRequestButton userId={userId}>
          <UserPlusIcon className="size-4" />
          Add
        </FriendRequestButton>
      )}
    </TooltipWrapper>
  );
};
