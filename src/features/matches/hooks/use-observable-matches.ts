import {
  ArenaProblemConfigTable,
  MatchTable,
  ProblemTable,
  UserMatchTable,
} from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { DEFAULT_PAGE } from "@/lib/constants";
import { changeObjectValues } from "@/lib/utils";
import { useEffect, useRef, useState, useTransition } from "react";
import { getObservableMatchesAction } from "../actions/actions";
import { useMatchObserverSocket } from "./use-match-observer-socket";
import { useObservableMatchParams } from "./use-observable-match-params";

type ObservableMatch = typeof MatchTable.$inferSelect & {
  arenaProblem: typeof ArenaProblemConfigTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
  };
  users: (typeof UserMatchTable.$inferSelect & { user: User })[];
};

export const useObservableMatches = (
  initialMatches: ObservableMatch[],
  initialHasNextPage: boolean,
) => {
  const [filters] = useObservableMatchParams();
  const { subscribeObserverEvent } = useMatchObserverSocket();
  const [observableMatches, setObservableMatches] = useState(initialMatches);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setObservableMatches(initialMatches);
    setPage(DEFAULT_PAGE);
    setHasNextPage(initialHasNextPage);
  }, [initialMatches, initialHasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getObservableMatchesAction({
            ...filters,
            page: nextPage,
          });
          if (!response) return;

          const { matches, metadata } = response;

          setObservableMatches((prev) => [...prev, ...matches]);
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

  useEffect(() => {
    const unsubscribe = subscribeObserverEvent(
      "observable_match_count_updated",
      (event) => {
        const payload = event.payload;
        if (payload.type === "added") {
          const newMatch = changeObjectValues<ObservableMatch>(
            payload.match,
            ["createdAt", "updatedAt", "expiresAt"],
            (arg) => {
              if (typeof arg === "string" || typeof arg === "number") {
                return new Date(arg);
              }
              return arg;
            },
          );

          setObservableMatches((prev) => [newMatch, ...prev]);
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [subscribeObserverEvent]);

  return { observableMatches, sentinelRef, isPending };
};
