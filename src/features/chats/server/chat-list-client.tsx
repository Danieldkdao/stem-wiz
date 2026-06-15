"use client";

import { NotFound } from "@/components/not-found";
import { ChatTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { FriendChatCard } from "../components/friend-chat-card";
import { useFriendChats } from "../hooks/use-friend-chats";
import { Loader2Icon } from "lucide-react";

export const ChatListClient = ({
  initialChats,
  initialHasNextPage,
}: {
  initialChats: (typeof ChatTable.$inferSelect & {
    user: User;
    messageCount: number;
  })[];
  initialHasNextPage: boolean;
}) => {
  const { chats, sentinelRef, isPending } = useFriendChats(
    initialChats,
    initialHasNextPage,
  );

  return (
    <div className="w-full">
      {chats.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {chats.map((chat) => (
            <FriendChatCard key={chat.id} chat={chat} />
          ))}
        </div>
      ) : (
        <NotFound
          title="Chats not found"
          description="We were unable to find any chats that match the selected filters. Try adjusting your search input or refreshing the page."
        />
      )}
      <div ref={sentinelRef} className="h-1 w-full bg-transparent" />
      {isPending && (
        <div className="flex items-center justify-center">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
    </div>
  );
};
