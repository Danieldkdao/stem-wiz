import { ErrorState } from "@/components/error-state";
import { getFriendChatsAction } from "@/features/chats/actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { DashboardSection } from "../dashboard-section";
import { MessageSquareTextIcon } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "../empty-state";
import { LinkButton } from "@/components/link-button";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const ChatsSection = () => {
  return (
    <Suspense fallback={<ChatsSectionLoading />}>
      <ChatsSectionSuspense />
    </Suspense>
  );
};

const ChatsSectionLoading = () => {
  return (
    <DashboardSection
      icon={MessageSquareTextIcon}
      title="Chats"
      href="/community/chats"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-0 items-center gap-3 border-b p-4 last:border-b-0"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="h-4 w-28 max-w-full" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      ))}
    </DashboardSection>
  );
};

const ChatsSectionSuspense = async () => {
  const response = await getFriendChatsAction({
    search: "",
    sortBy: "most_recent_activity",
    filterBy: "all",
    page: DEFAULT_PAGE,
  });
  if (!response)
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );

  const { chats } = response;

  return (
    <DashboardSection
      icon={MessageSquareTextIcon}
      title="Chats"
      href="/community/chats"
    >
      {chats.length ? (
        chats.slice(0, 3).map((chat) => (
          <Link key={chat.id} href={`/community/chats/${chat.id}`}>
            <div className="flex min-w-0 items-center gap-3 border-b p-4 last:border-b-0">
              <UserAvatar
                {...chat.user}
                className="size-10 shrink-0"
                textClassName="text-sm"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">
                  {chat.title || chat.user.name}
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  with {chat.user.name}
                </p>
              </div>
              <Badge variant="secondary">{chat.messageCount}</Badge>
            </div>
          </Link>
        ))
      ) : (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="No chats yet"
          description="Start a conversation with a friend."
          compact
        >
          <LinkButton href="/community/chats" size="sm">
            Start chat
          </LinkButton>
        </EmptyState>
      )}
    </DashboardSection>
  );
};
