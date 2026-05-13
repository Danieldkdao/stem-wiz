import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SetterType } from "@/lib/types";
import Link from "next/link";

type MatchFinishedDialog = {
  open: boolean;
  setOpen: SetterType<boolean>;
  matchId: string;
};

export const MatchFinishedDialog = ({
  open,
  setOpen,
  matchId,
}: MatchFinishedDialog) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex flex-col gap-4 items-center [&>button:last-child]:hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="hidden">
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>

        <h1 className="text-center text-2xl font-semibold">Match Finished</h1>
        <p className="text-center text-muted-foreground">
          This match has concluded because both participants have submitted
          their code. Go the the results page to find out the result!
        </p>
        <Button className="w-full" asChild>
          <Link href={`/arena/matches/${matchId}/results`}>Go to Results</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
};
