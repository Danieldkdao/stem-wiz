import { Button } from "@/components/ui/button";
import { getFriendChats } from "@/features/chats/actions/actions";
import { CreateUpdateFriendChatDialog } from "@/features/chats/components/create-update-chat-dialog";
import { FriendChatCard } from "@/features/chats/components/friend-chat-card";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

export const CommunityChatView = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <h1 className="text-3xl font-semibold">Your Chats</h1>
        <CreateUpdateFriendChatDialog>
          <Button>
            <PlusIcon />
            Start new chat
          </Button>
        </CreateUpdateFriendChatDialog>
      </div>
      <Suspense fallback={<CommunityChatViewLoading />}>
        <CommunityChatViewSuspense />
      </Suspense>
    </div>
  );
};

const CommunityChatViewLoading = () => {
  return <div>loading</div>;
};

const CommunityChatViewSuspense = async () => {
  const chats = await getFriendChats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {chats.map((chat) => (
        <FriendChatCard key={chat.id} chat={chat} />
      ))}
    </div>
  );
};
