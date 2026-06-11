import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";
import { getFriendChatMessagesAction } from "../actions/actions";
import { FriendChatMessageListClient } from "./friend-chat-message-list-client";

type FriendChatMessageListProps = { chatId: string; friendRequestId: string };

export const FriendChatMessageList = (props: FriendChatMessageListProps) => {
  return (
    <Suspense fallback={<FriendChatMessageListLoading />}>
      <FriendChatMessageListSuspense {...props} />
    </Suspense>
  );
};

const FriendChatMessageListLoading = () => {
  return <div>loading</div>;
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
