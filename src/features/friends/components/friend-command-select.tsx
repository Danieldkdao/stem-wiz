"use client";

import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { UserAvatar } from "@/components/user-avatar";
import { DEFAULT_PAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { ChevronsUpDownIcon, Loader2Icon } from "lucide-react";
import { ComponentProps, useEffect, useState, useTransition } from "react";
import { getUserFriendsAction } from "../actions/actions";

type Friends = NonNullable<
  Awaited<ReturnType<typeof getUserFriendsAction>>
>["friends"];

export const FriendCommandSelect = ({
  value,
  onValueChange,
  onClick,
  type,
  className,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
} & ComponentProps<typeof Button>) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState(value);
  const [friends, setFriends] = useState<Friends>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(DEFAULT_PAGE - 1);
  const [isInfinitePending, startInfiniteTransition] = useTransition();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  const handleSearch = () => {
    startSearchTransition(async () => {
      const response = await getUserFriendsAction({
        search,
        page: DEFAULT_PAGE,
      });
      if (!response) return;

      const { friends, metadata } = response;

      setFriends(friends);
      setPage(DEFAULT_PAGE);
      setHasNextPage(metadata.hasNextPage);
    });
  };
  const handleDebouncedSearch = useDebouncedCallback(handleSearch, {
    wait: 300,
  });

  const selectedFriend = friends.find(
    (friend) => friend.id === selectedFriendId,
  );

  useEffect(() => {
    if (!sentinelEl || isInfinitePending || !hasNextPage || !open) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startInfiniteTransition(async () => {
          const nextPage = page + 1;

          const response = await getUserFriendsAction({
            search,
            page: nextPage,
          });
          if (!response) return;

          const { friends, metadata } = response;

          setFriends((prev) => [...prev, ...friends]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      {
        root: containerEl,
        rootMargin: "400px",
      },
    );

    observer.observe(sentinelEl);

    return () => observer.disconnect();
  }, [hasNextPage, sentinelEl, containerEl, page, isInfinitePending, open]);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "flex items-center gap-2 justify-start w-full min-w-0",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
        {...props}
      >
        {selectedFriend ? (
          <div className="flex-1 w-full min-w-0 flex items-center gap-2">
            <UserAvatar
              {...selectedFriend.user}
              className="size-6"
              textClassName="text-xs"
            />
            <span className="text-left flex-1 min-w-0 truncate">
              {selectedFriend.user.name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-left flex-1 min-w-0 truncate">
            Select a friend...
          </span>
        )}
        <ChevronsUpDownIcon className="text-muted-foreground" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="md:max-w-4xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={(search) => {
              setSearch(search);
              handleDebouncedSearch();
            }}
            placeholder="Search by name or email..."
          />
          <CommandList ref={setContainerEl}>
            {!isSearchPending && friends.length ? (
              <CommandGroup className="mt-2">
                <div className="flex flex-col gap-2">
                  {friends.map((f) => {
                    const { user, ...friend } = f;
                    const isSelected = selectedFriendId === friend.id;

                    return (
                      <CommandItem
                        key={friend.id}
                        value={friend.id}
                        onSelect={(friendId) => {
                          setSelectedFriendId(friendId);
                          onValueChange(friendId);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-4 w-full min-w-0",
                          isSelected && "bg-accent/15!",
                        )}
                        showCheckIcon={false}
                      >
                        <UserAvatar {...user} className="size-10" />
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="text-base font-medium truncate">
                            {user.name}
                          </span>
                          <span className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            ) : !isInfinitePending && !isSearchPending ? (
              <NotFound
                title="No friends found"
                description="We were unable to find any friends that match the search terms above. Try adjusting your query to be more specific."
              />
            ) : null}
            {(isInfinitePending || isSearchPending) && (
              <div className="flex items-center justify-center w-full my-2">
                <Loader2Icon className="text-primary animate-spin" />
              </div>
            )}
            <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};
