import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { FriendRequestTable } from "@/db/schema";
import {
  CircleQuestionMarkIcon,
  UserCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import { FriendRequestButton } from "./friend-request-button";
import { RespondFriendRequestButton } from "./respond-friend-request-button";
import { Badge } from "@/components/ui/badge";

export const FriendRequestStatusButtons = ({
  userId,
  existingFriendRequest,
}: {
  userId: string;
  existingFriendRequest?: typeof FriendRequestTable.$inferSelect;
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
              ? "You are friends with this user."
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
        ) : existingFriendRequest.status === "accepted" ? (
          <Badge>
            <UserCheckIcon />
            <span>Your friend</span>
          </Badge>
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
