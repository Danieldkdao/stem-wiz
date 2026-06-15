import { Button } from "@/components/ui/button";
import { getFriendChatsAction } from "@/features/chats/actions/actions";
import { CreateUpdateFriendChatDialog } from "@/features/chats/components/create-update-chat-dialog";
import { ChatListClient } from "@/features/chats/server/chat-list-client";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { SearchParams } from "nuqs";
import { loadFriendChatSearchParams } from "@/features/chats/lib/friend-chat-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { CommunityChatFilters } from "@/features/user/components/community-chat-filters";

type CommunityChatParams = {
  searchParams: Promise<SearchParams>;
};

const CommunityChatPage = (props: CommunityChatParams) => {
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
      <Suspense fallback={<CommunityChatLoading />}>
        <CommunityChatSuspense {...props} />
      </Suspense>
    </div>
  );
};

const CommunityChatLoading = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-full rounded-md" />

        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

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
    </div>
  );
};

const CommunityChatSuspense = async ({ searchParams }: CommunityChatParams) => {
  const filters = await loadFriendChatSearchParams(searchParams);
  const response = await getFriendChatsAction({
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="Failed to fetch chats"
        description="We were unable to retrive your chats. Try refreshing the page or coming back another time."
      />
    );
  }

  const { chats, metadata } = response;

  return (
    <div className="flex flex-col gap-6">
      <CommunityChatFilters />
      <ChatListClient
        initialChats={chats}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default CommunityChatPage;
