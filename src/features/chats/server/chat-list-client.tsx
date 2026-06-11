"use client";

import { ChatTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { useFriendChats } from "../hooks/use-friend-chats";
import { FriendChatCard } from "../components/friend-chat-card";

export const ChatListClient = ({
  initialChats,
}: {
  initialChats: (typeof ChatTable.$inferSelect & {
    user: User;
    messageCount: number;
  })[];
}) => {
  const chats = useFriendChats(initialChats);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {chats.map((chat) => (
        <FriendChatCard key={chat.id} chat={chat} />
      ))}
    </div>
  );
};
