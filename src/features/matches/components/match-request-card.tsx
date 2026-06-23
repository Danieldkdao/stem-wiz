import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { getDifficultyBadge } from "@/features/oracle/lib/formatters";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { cn } from "@/lib/utils";
import { MatchRequest } from "../lib/types";
import {
  getMatchRequestStatus,
  getMatchRequestStatusContent,
} from "../lib/utils";
import { MatchRequestDetailsDialog } from "./match-request-details-dialog";

export const MatchRequestCard = ({
  initialMatchRequest,
}: {
  initialMatchRequest: MatchRequest;
}) => {
  const { problem, friend, isSent } = initialMatchRequest;
  const matchRequestStatus = getMatchRequestStatus(initialMatchRequest);

  const {
    information: Information,
    cta: CTA,
    badge: StatusBadge,
  } = getMatchRequestStatusContent(matchRequestStatus, initialMatchRequest);

  return (
    <Card
      className={cn(
        "border-t-4 w-full min-w-0 h-full",
        isSent ? "border-t-chart-2" : "border-primary",
        matchRequestStatus === "expired" && "opacity-75",
      )}
    >
      <CardContent className="w-full h-full min-w-0 flex flex-col gap-4">
        <div className="flex items-start gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <UserAvatar
              {...friend}
              className="size-14"
              textClassName="text-base"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-medium text-muted-foreground">
                {isSent ? "Sent to" : "Received from"}
              </span>
              <span className="text-xl font-semibold">{friend.name}</span>
            </div>
          </div>
          <StatusBadge />
        </div>

        <div className="flex flex-col gap-2 w-full min-w-0">
          <MatchRequestDetailsDialog matchRequest={initialMatchRequest}>
            <div className="flex flex-col gap-0.5 w-full min-w-0 cursor-pointer">
              <h2 className="text-2xl font-semibold truncate">
                {problem.title}
              </h2>
              <p className="text-base text-muted-foreground line-clamp-2">
                {problem.description}
              </p>
            </div>
          </MatchRequestDetailsDialog>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="rounded-md">
              {formatProgrammingLanguage(problem.programmingLanguage)}
            </Badge>
            {getDifficultyBadge(problem.difficultyLevel, "rounded-md")}
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-auto">
          <Separator />
          <Information />
          <CTA />
        </div>
      </CardContent>
    </Card>
  );
};
