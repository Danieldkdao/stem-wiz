"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CommunityProblemInvitationTable,
  CommunityProblemTable,
  ProblemTable,
} from "@/db/schema";
import { ReactNode, useLayoutEffect, useState } from "react";
import { CommunityProblemForm } from "./community-problem-form";

export const CommunityProblemDialog = ({
  children,
  existingProblem,
}: {
  children: ReactNode;
  existingProblem?: typeof CommunityProblemTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
    invitations: (typeof CommunityProblemInvitationTable.$inferSelect)[];
  };
}) => {
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-0 overflow-x-hidden sm:max-w-5xl!">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {existingProblem ? "Update" : "Create"} Problem
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existingProblem
              ? "Update your existing problem."
              : "Create a new community problem."}
          </DialogDescription>
        </DialogHeader>
        <CommunityProblemForm
          existingProblem={existingProblem}
          afterAction={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
