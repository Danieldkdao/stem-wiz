"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { getUserFriendsAction } from "@/features/friend-requests/actions/actions";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ComponentProps } from "react";

export const FriendsSelect = ({
  triggerClassName,
  ...props
}: { triggerClassName?: string } & ComponentProps<typeof Select>) => {
  const {
    data: friends,
    isPending,
    error,
  } = useQuery({
    queryKey: ["friend_requests"],
    queryFn: getUserFriendsAction,
  });

  if (isPending) return <div>loading</div>;
  if (error) return <div>error</div>;
  if (!friends || !friends.length) return <div>no data</div>;

  return (
    <Select {...props}>
      <SelectTrigger className={cn("w-full", triggerClassName)}>
        <SelectValue placeholder="Select a friend..." />
      </SelectTrigger>
      <SelectContent>
        {friends.map((friend) => (
          <SelectItem
            key={friend.id}
            value={friend.id}
            className="flex items-center gap-2"
          >
            <UserAvatar
              {...friend.user}
              className="size-6"
              textClassName="text-sm"
            />
            <span className="text-sm font-medium">{friend.user.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
