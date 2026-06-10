import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { getFriendChatAction } from "@/features/chats/actions/actions";
import { FriendChatMessageInput } from "@/features/chats/components/friend-chat-message-input";
import { FriendChatMessageList } from "@/features/chats/components/friend-chat-message-list";
import { ParamsId } from "@/lib/types";
import { EditIcon, Trash2Icon } from "lucide-react";
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
    <div className="w-full h-full">
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="flex items-center gap-2 w-full min-w-0 border-b">
          <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
            <UserAvatar {...friendRequest.user} />
            <span className="text-lg font-semibold">
              {friendRequest.user.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <EditIcon />
            </Button>
            <Button variant="destructive" size="icon">
              <Trash2Icon />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="w-full h-full flex-1 overflow-y-auto">
          <FriendChatMessageList
            chatId={chat.id}
            friendRequestId={friendRequest.id}
          />
        </CardContent>
        <CardFooter className="border-t">
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
