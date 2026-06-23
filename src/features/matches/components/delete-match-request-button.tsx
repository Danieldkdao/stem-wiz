"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { deleteMatchRequestAction } from "../actions/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const DeleteMatchRequestButton = ({
  matchRequestId,
  children,
  onClick,
  disabled,
  className,
  ...props
}: {
  matchRequestId: string;
  children: ReactNode;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure you to delete this friend request? This action will result in a permanent loss of data and cannot be undone.",
  );

  const handleMatchRequestDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteMatchRequestAction(matchRequestId);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        router.refresh();
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        onClick={handleMatchRequestDeletion}
        disabled={isPending || disabled}
        {...props}
      >
        <LoadingSwap className={className} isLoading={isPending}>
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
