"use client";

import { OracleSessionStatusType } from "@/db/shared";
import { ORACLE_SESSION_STATE } from "../lib/constants";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { startSessionAction } from "../actions/actions";
import { toast } from "sonner";
import { useTransition } from "react";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const SessionActionButton = ({
  sessionId,
  status,
}: {
  sessionId: string;
  status: OracleSessionStatusType;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statusState = ORACLE_SESSION_STATE[status];

  const handleStartSession = async () => {
    if (status !== "upcoming") return;

    const toastId = toast.loading(
      "Scaffolding problems and configuring details...",
    );
    startTransition(async () => {
      const response = await startSessionAction(sessionId);
      toast.dismiss(toastId);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        router.push(`/oracle/sessions/${sessionId}`);
      }
    });
  };

  return (
    <Button
      className="w-full"
      disabled={statusState.isDisabled || isPending}
      onClick={handleStartSession}
    >
      <LoadingSwap isLoading={isPending}>{statusState.buttonText}</LoadingSwap>
    </Button>
  );
};
