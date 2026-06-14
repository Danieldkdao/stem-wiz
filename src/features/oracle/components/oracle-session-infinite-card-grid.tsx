"use client";

import { OracleSessionTable } from "@/db/schema";
import { useOracleSessionParams } from "../hooks/use-oracle-session-params";
import { useEffect, useRef, useState, useTransition } from "react";
import { DEFAULT_PAGE } from "@/lib/constants";
import { getUserSessionsAction } from "../actions/actions";
import { OracleSessionCard } from "./oracle-session-card";
import { Card, CardContent } from "@/components/ui/card";
import { SearchXIcon } from "lucide-react";

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

  return oracleSessions.length ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {oracleSessions.map((session) => (
        <OracleSessionCard key={session.id} session={session} />
      ))}
    </div>
  ) : (
    <Card className="ring-0 border-4 border-dashed bg-card/75">
      <CardContent className="flex flex-col items-center gap-2 py-4 w-full">
        <SearchXIcon className="size-10" />
        <h1 className="text-3xl font-semibold text-center">
          No sessions found
        </h1>
        <p className="text-muted-foreground text-lg text-center max-w-150">
          We couldn't find any sessions that match the current filters. Try
          changing the filters or starting a new session.
        </p>
      </CardContent>
    </Card>
  );
};
