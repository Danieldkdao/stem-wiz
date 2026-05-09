"use client";

import { Button } from "@/components/ui/button";
import { useMatchSocket } from "@/hooks/use-match-socket";

export const MatchTester = () => {
  const {
    status,
    match,
    lastEvent,
    connect,
    joinWaitingRoom,
    leaveWaitingRoom,
  } = useMatchSocket();
  return (
    <div className="flex flex-col">
      <div>Status: {status}</div>

      <div className="flex gap-2">
        <Button onClick={connect}>Connect</Button>
        <Button onClick={joinWaitingRoom} disabled={status !== "open"}>
          Join Waiting Room
        </Button>
        <Button onClick={leaveWaitingRoom} disabled={status !== "open"}>
          Leave Waiting Room
        </Button>
      </div>

      {match ? (
        <div>
          Match found: {match.matchId}
          <br />
          Opponent: {match.opponentId}
        </div>
      ) : null}

      <pre>{JSON.stringify(lastEvent, null, 2)}</pre>
    </div>
  );
};
