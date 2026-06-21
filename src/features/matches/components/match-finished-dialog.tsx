import { LinkButton } from "@/components/link-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SetterType } from "@/lib/types";
import { MatchResultReasonType } from "@/db/shared";

type MatchFinishedDialog = {
  open: boolean;
  setOpen: SetterType<boolean>;
  matchId: string;
  reason?: MatchResultReasonType | undefined;
};

export const MatchFinishedDialog = ({
  open,
  setOpen,
  matchId,
  reason = "traditional",
}: MatchFinishedDialog) => {
  const reasonDisplayMap: Record<
    MatchResultReasonType,
    { message: string; redirectText: string; redirectTo: string }
  > = {
    traditional: {
      message:
        "This match has concluded because both participants have submitted their code. Go the the results page to find out the result!",
      redirectTo: `/arena/matches/${matchId}/results`,
      redirectText: "Go to Results",
    },
    user_lost_connection: {
      message:
        "This match has concluded because one of the participants lost connection and couldn't resume. Try heading to the observable matches page and see if there are more matches going on there.",
      redirectTo: "/arena/observe",
      redirectText: "Explore other Matches",
    },
    user_quit: {
      message:
        "This match has concluded because one of the participants has quit the match. Try heading to the observable matches page and see if there are more matches going on there.",
      redirectTo: "/arena/observe",
      redirectText: "Explore other Matches",
    },
    timeout: {
      message:
        "This match has concluded because the time limit has been reached. Try heading to the observable matches page and see if there are more matches going on there.",
      redirectTo: "/arena/observe",
      redirectText: "Explore other Matches",
    },
  };

  const reasonDisplay = reasonDisplayMap[reason];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col gap-4 items-center [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Match Finished</DialogTitle>
          <DialogDescription>{reasonDisplay.message}</DialogDescription>
        </DialogHeader>

        <h1 className="text-center text-2xl font-semibold">Match Finished</h1>
        <p className="text-center text-muted-foreground">
          {reasonDisplay.message}
        </p>
        <LinkButton className="w-full" href={reasonDisplay.redirectTo}>
          {reasonDisplay.redirectText}
        </LinkButton>
      </DialogContent>
    </Dialog>
  );
};
