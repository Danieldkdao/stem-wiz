import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { getFriendChatAction } from "@/features/chats/actions/actions";
import { FriendChatHeader } from "@/features/chats/components/friend-chat-header";
import { FriendChatMessageInput } from "@/features/chats/components/friend-chat-message-input";
import { FriendChatMessageList } from "@/features/chats/components/friend-chat-message-list";
import { ParamsId } from "@/lib/types";
import { Suspense } from "react";

type ChatIdParams = ParamsId<"chatId">;

const ChatIdPage = (props: ChatIdParams) => {
  return (
    <Suspense fallback={<ChatIdLoading />}>
      <ChatIdSuspense {...props} />
    </Suspense>
  );
};

const ChatIdLoading = () => {
  return <div>loading</div>;
};

const ChatIdSuspense = async ({ params }: ChatIdParams) => {
  const { chatId } = await params;
  const response = await getFriendChatAction(chatId);
  if (!response) {
    return <div>not found</div>;
  }

  const { chat, friendRequest } = response;

  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <Card className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <CardHeader className="shrink-0 w-full min-w-0 border-b">
          <FriendChatHeader chat={chat} friendRequest={friendRequest} />
        </CardHeader>

        <FriendChatMessageList
          chatId={chat.id}
          friendRequestId={friendRequest.id}
        />
        <CardFooter className="border-t shrink-0">
          <FriendChatMessageInput
            chatId={chat.id}
            friendRequestId={friendRequest.id}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatIdPage;
