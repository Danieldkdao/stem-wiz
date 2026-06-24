"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getUserMatchObserverInvitationsAction } from "../actions/actions";
import { useMatchObserverInvitationParams } from "../hooks/use-match-observer-invitation-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { NotFound } from "@/components/not-found";
import { RefreshPageButton } from "@/components/refresh-page-button";
import { MatchObserverInvitationCard } from "./match-observer-invitation-card";

type MatchObserverInvitations = NonNullable<
  Awaited<ReturnType<typeof getUserMatchObserverInvitationsAction>>
>["matchObserverInvitations"];

export const MatchObserverInvitationInfiniteCardGrid = ({
  currentUserId,
  initialMatchObserverInvitations,
  initialHasNextPage,
}: {
  currentUserId: string;
  initialMatchObserverInvitations: MatchObserverInvitations;
  initialHasNextPage: boolean;
}) => {
  const [filters] = useMatchObserverInvitationParams();
  const [matchObserverInvitations, setMatchObserverInvitations] = useState(
    initialMatchObserverInvitations,
  );
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMatchObserverInvitations(initialMatchObserverInvitations);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialMatchObserverInvitations, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getUserMatchObserverInvitationsAction({
            ...filters,
            page: nextPage,
          });
          if (!response) return;

          const { matchObserverInvitations, metadata } = response;

          setMatchObserverInvitations((prev) => [
            ...prev,
            ...matchObserverInvitations,
          ]);
          setHasNextPage(metadata.hasNextPage);
          setPage(nextPage);
        });
      },
      {
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [filters, page, hasNextPage, isPending]);

  return matchObserverInvitations.length ? (
    <div className="grid grid-cols grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matchObserverInvitations.map((invitation) => (
        <MatchObserverInvitationCard
          key={invitation.id}
          currentUserId={currentUserId}
          matchObserverInvitation={invitation}
        />
      ))}
    </div>
  ) : (
    <NotFound
      title="No invitations found"
      description="We weren't able to find any invitations that match the selected filters. Try adjusting your search terms or refresh the page."
    >
      <RefreshPageButton variant="outline" className="w-full">
        Refresh the page
      </RefreshPageButton>
    </NotFound>
  );
};
