import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";
import { getFriendChatMessagesAction } from "../actions/actions";
import { FriendChatMessageListClient } from "./friend-chat-message-list-client";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type FriendChatMessageListProps = { chatId: string; friendRequestId: string };

export const FriendChatMessageList = (props: FriendChatMessageListProps) => {
  return (
    <Suspense fallback={<FriendChatMessageListLoading />}>
      <FriendChatMessageListSuspense {...props} />
    </Suspense>
  );
};

const FriendChatMessageListLoading = () => {
  return (
    <CardContent className="w-full h-full flex-1 overflow-y-auto min-h-0">
      <div className="flex h-full w-full flex-col gap-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex w-full min-w-0 items-start gap-2 rounded-md p-2"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-2 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-5 w-full max-w-2xl" />
              <Skeleton className="h-5 w-4/5 max-w-xl" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
};

const FriendChatMessageListSuspense = async ({
  chatId,
  friendRequestId,
}: FriendChatMessageListProps) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;
  const chatMessages = await getFriendChatMessagesAction(
    chatId,
    friendRequestId,
  );
  if (!chatMessages) return <div>not found</div>;
  return (
    <FriendChatMessageListClient
      initialMessages={chatMessages}
      friendRequestId={friendRequestId}
      userId={userId}
    />
  );
};
