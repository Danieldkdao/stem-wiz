"use client";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { getUserFriendsAction } from "@/features/friends/actions/actions";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ComponentProps } from "react";

export const FriendsMultiSelect = ({
  triggerClassName,
  ...props
}: { triggerClassName?: string } & Omit<
  ComponentProps<typeof MultiSelect>,
  "children"
>) => {
  const {
    data: friends,
    isPending,
    error,
  } = useQuery({
    queryKey: ["friendships"],
    queryFn: () => getUserFriendsAction({ search: "", page: 1 }),
  });

  if (isPending)
    return <Skeleton className={cn("h-9 w-full", triggerClassName)} />;

  if (error) return <div>error</div>;
  if (!friends || !friends.friends.length) return <div>no data</div>;

  return (
    <MultiSelect {...props}>
      <MultiSelectTrigger className={cn("w-full", triggerClassName)}>
        <MultiSelectValue placeholder="Select friends" />
      </MultiSelectTrigger>
      <MultiSelectContent>
        {friends.friends.map((friend) => (
          <MultiSelectItem
            key={friend.id}
            value={friend.id}
            className="flex items-center gap-2"
          >
            <UserAvatar
              {...friend.user}
              className="size-6"
              textClassName="text-xs"
            />
            <span className="text-sm font-medium">{friend.user.name}</span>
          </MultiSelectItem>
        ))}
      </MultiSelectContent>
    </MultiSelect>
  );
};
