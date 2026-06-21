import { LinkButton } from "@/components/link-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SetterType } from "@/lib/types";

type OracleSessionCompleteDialogProps = {
  open: boolean;
  setOpen: SetterType<boolean>;
  sessionId: string;
};

export const OracleSessionCompleteDialog = ({
  open,
  setOpen,
  sessionId,
}: OracleSessionCompleteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col gap-4 items-center [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Session Complete</DialogTitle>
          <DialogDescription>This session is complete.</DialogDescription>
        </DialogHeader>

        <h1 className="text-center text-2xl font-semibold">Session Complete</h1>
        <p className="text-center text-muted-foreground">
          You have completed all problems in the session. Go to the summary page
          to take a look at the breakdown.
        </p>
        <LinkButton
          className="w-full"
          href={`/oracle/sessions/${sessionId}/summary`}
        >
          View Summary
        </LinkButton>
        <LinkButton className="w-full" variant="outline" href="/oracle/sessions">
          Back to sessions
        </LinkButton>
      </DialogContent>
    </Dialog>
  );
};
