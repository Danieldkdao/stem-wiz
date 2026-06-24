"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getUserMatchRequestsAction } from "../actions/actions";
import { useMatchRequestsParams } from "../hooks/use-match-request-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { NotFound } from "@/components/not-found";
import { RefreshPageButton } from "@/components/refresh-page-button";
import { Loader2Icon } from "lucide-react";
import { MatchRequestCard } from "./match-request-card";

type MatchRequests = NonNullable<
  Awaited<ReturnType<typeof getUserMatchRequestsAction>>
>["matchRequests"];

export const MatchRequestInfiniteCardGrid = ({
  initialMatchRequests,
  initialHasNextPage,
}: {
  initialMatchRequests: MatchRequests;
  initialHasNextPage: boolean;
}) => {
  const [filters] = useMatchRequestsParams();
  const [matchRequests, setMatchRequests] = useState(initialMatchRequests);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMatchRequests(initialMatchRequests);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialMatchRequests, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getUserMatchRequestsAction({
            ...filters,
            page: nextPage,
          });
          if (!response) return;

          const { matchRequests, metadata } = response;

          setMatchRequests((prev) => [...prev, ...matchRequests]);
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
  }, [filters, page, hasNextPage, isPending]);

  return (
    <div>
      {matchRequests.length ? (
        <div className="grid grid-cols grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchRequests.map((matchRequest) => (
            <MatchRequestCard
              key={matchRequest.id}
              initialMatchRequest={matchRequest}
            />
          ))}
        </div>
      ) : (
        <NotFound
          title="No match requests found"
          description="We were unable to find any match requests that match the selected filters. Try adjusting your search or refreshing the page."
        >
          <RefreshPageButton variant="outline" className="w-full">
            Refresh the page
          </RefreshPageButton>
        </NotFound>
      )}
      {isPending && (
        <div className="flex items-center justify-center w-full">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
      <div ref={sentinelRef} className="w-full h-1 bg-transparent" />
    </div>
  );
};
