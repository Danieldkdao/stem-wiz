import { Suspense } from "react";
import { getFriendChatMessagesAction } from "../actions/actions";
import { FriendChatMessage } from "./friend-chat-message";
import { getCurrentUser } from "@/lib/auth/helpers";

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
  return chatMessages.length ? (
    <div className="flex flex-col gap-1 w-full">
      {chatMessages.map((msg) => (
        <FriendChatMessage
          key={msg.id}
          chatMessage={msg}
          friendRequestId={friendRequestId}
          currentUserId={userId}
        />
      ))}
    </div>
  ) : (
    <div>empty state</div>
  );
};
