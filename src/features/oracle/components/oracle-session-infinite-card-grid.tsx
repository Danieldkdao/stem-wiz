"use client";

import { NotFound } from "@/components/not-found";
import { OracleSessionTable } from "@/db/schema";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { getUserSessionsAction } from "../actions/actions";
import { useOracleSessionParams } from "../hooks/use-oracle-session-params";
import { OracleSessionCard } from "./oracle-session-card";

export const OracleSessionInfiniteCardGrid = ({
  initialOracleSessions,
  initialHasNextPage,
  userId,
}: {
  initialOracleSessions: (typeof OracleSessionTable.$inferSelect)[];
  initialHasNextPage: boolean;
  userId: string;
}) => {
  const [filters] = useOracleSessionParams();
  const [oracleSessions, setOracleSessions] = useState(initialOracleSessions);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOracleSessions(initialOracleSessions);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialOracleSessions, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const { userSessions, metadata } = await getUserSessionsAction(
            userId,
            { ...filters, page: nextPage },
          );

          setOracleSessions((prev) => [...prev, ...userSessions]);
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
    <div className="w-full">
      {oracleSessions.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {oracleSessions.map((session) => (
            <OracleSessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <NotFound
          title="No sessions found"
          description="We couldn't find any sessions that match the current filters. Try
          changing the filters or starting a new session."
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
