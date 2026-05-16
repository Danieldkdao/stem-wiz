import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckCircleIcon, CircleDashedIcon } from "lucide-react";

type MatchParticipantStatuses = {
  hasSubmittedCode: boolean;
  isMirrored: boolean;
};

export const MatchParticipantStatuses = ({
  hasSubmittedCode,
  isMirrored,
}: MatchParticipantStatuses) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isMirrored && "flex-row-reverse",
      )}
    >
      <Tooltip>
        <TooltipTrigger>
          {hasSubmittedCode ? (
            <CheckCircleIcon className="text-primary" />
          ) : (
            <CircleDashedIcon className="text-muted-foreground" />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {hasSubmittedCode
            ? "This user has submitted their code."
            : "This user hasn't submitted their code yet."}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
