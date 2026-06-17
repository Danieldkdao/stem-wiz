import { NotFound } from "@/components/not-found";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <Card className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <CardHeader className="shrink-0 w-full min-w-0 border-b">
          <div className="flex items-center gap-2 w-full">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <div className="h-6 w-px bg-border" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>
        </CardHeader>

        <ChatMessagesSkeleton />

        <CardFooter className="border-t shrink-0">
          <div className="w-full flex flex-col gap-4">
            <Skeleton className="h-50 w-full rounded-md" />
            <Skeleton className="h-9 w-9 self-end rounded-md" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

const ChatMessagesSkeleton = () => {
  return (
    <div className="w-full h-full flex-1 overflow-y-auto min-h-0 px-6">
      <div className="flex h-full w-full flex-col gap-1 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
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
    </div>
  );
};

const ChatIdSuspense = async ({ params }: ChatIdParams) => {
  const { chatId } = await params;
  const response = await getFriendChatAction(chatId);
  if (!response) {
    return (
      <div className="w-full h-full py-10 px-6">
        <NotFound
          title="Chat not found"
          description="We were unable to find that chat. Try checking the url or refreshing the page."
        />
      </div>
    );
  }

  const { chat, friendship } = response;

  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <Card className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <CardHeader className="shrink-0 w-full min-w-0 border-b">
          <FriendChatHeader chat={chat} friendship={friendship} />
        </CardHeader>

        <FriendChatMessageList chatId={chat.id} />
        <CardFooter className="border-t shrink-0">
          <FriendChatMessageInput chatId={chat.id} />
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatIdPage;
