"use client";

import { useEffect } from "react";
import { useMatchObserverSocket } from "../hooks/use-match-observer-socket";
import { statusMap } from "@/features/arena/components";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const MatchObserverListStatus = () => {
  const router = useRouter();
  const { status, connect, error, lastEvent, connectToMatchObservers } =
    useMatchObserverSocket();

  useEffect(() => {
    if (status === "connecting" || status === "open") return;

    void connect();
  }, [connect, status]);

  useEffect(() => {
    if (status !== "open") return;

    connectToMatchObservers();
  }, [connectToMatchObservers, status]);

  useEffect(() => {
    if (status !== "open") return;
    if (lastEvent?.type === "observable_match_count_updated") {
      router.refresh();
    }
  }, [status, lastEvent]);

  useEffect(() => {
    if (lastEvent?.type === "error" && error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="flex items-center gap-2 bg-card rounded-md py-2 px-4 border w-fit">
      {statusMap[status].element}
      <span>{statusMap[status].label}</span>
    </div>
  );
};
