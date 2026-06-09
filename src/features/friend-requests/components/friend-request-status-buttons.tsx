import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { FriendRequestTable } from "@/db/schema";
import {
  CircleQuestionMarkIcon,
  UserCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import { FriendRequestButton } from "./friend-request-button";
import { RespondFriendRequestButton } from "./respond-friend-request-button";

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
            <div className="flex items-center gap-2">
              <CircleQuestionMarkIcon className="size-4" />
              Pending
            </div>
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
          <div className="flex items-center gap-2">
            <UserCheckIcon className="text-emerald-500" />
            <span className="text-base text-emerald-500">Your friend</span>
          </div>
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
