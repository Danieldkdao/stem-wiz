"use client";

import { FriendRequestTable, UserProfileTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Loader2Icon, SearchXIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { getUsersAction } from "../actions/actions";
import { useCommunityParams } from "../hooks/use-community-params";
import { CommunityUserCard } from "./community-user-card";

export const CommunityUserInfiniteCardList = ({
  initialUsers,
  initialHasNextPage,
  userId,
}: {
  initialUsers: (User & {
    profile: typeof UserProfileTable.$inferSelect;
    existingFriendRequest: typeof FriendRequestTable.$inferSelect;
  })[];
  initialHasNextPage: boolean;
  userId: string;
}) => {
  const [filters] = useCommunityParams();
  const [users, setUsers] = useState(initialUsers);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsers(initialUsers);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialUsers, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const { users, metadata } = await getUsersAction(userId, {
            ...filters,
            page: nextPage,
          });

          setUsers((prev) => [...prev, ...users]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      {
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [filters, hasNextPage, page, isPending]);

  return (
    <div className="w-full grid grid-cols-1 gap-4">
      {users.length ? (
        users.map((user) => <CommunityUserCard key={user.id} user={user} />)
      ) : (
        <div className="w-full rounded-md border-4 border-dashed bg-card p-5 sm:p-10 flex flex-col items-center justify-center gap-2">
          <SearchXIcon className="size-10" />
          <h1 className="text-center text-2xl font-semibold">No users found</h1>
          <p className="text-muted-foreground text-lg text-center max-w-150">
            We couldn't find any users at this moment. Try adjusting your search
            terms or reloading the page.
          </p>
        </div>
      )}
      <div ref={sentinelRef} className="h-1 w-full bg-transparent" />
      {isPending && (
        <div className="flex items-center justify-center w-full p-2">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
    </div>
  );
};
