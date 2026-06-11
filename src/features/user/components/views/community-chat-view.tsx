import { Button } from "@/components/ui/button";
import { getFriendChats } from "@/features/chats/actions/actions";
import { CreateUpdateFriendChatDialog } from "@/features/chats/components/create-update-chat-dialog";
import { ChatListClient } from "@/features/chats/server/chat-list-client";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="w-full h-full">
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CommunityChatViewSuspense = async () => {
  const chats = await getFriendChats();

  return <ChatListClient initialChats={chats} />;
};
