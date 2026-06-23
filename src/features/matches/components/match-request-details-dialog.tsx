import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { getDifficultyBadge } from "@/features/oracle/lib/formatters";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { formatTime, getDuration } from "@/lib/utils";
import { ClockIcon, FlagIcon } from "lucide-react";
import { Fragment, ReactNode } from "react";
import { MatchRequest } from "../lib/types";
import {
  getMatchRequestStatus,
  getMatchRequestStatusContent,
} from "../lib/utils";

export const MatchRequestDetailsDialog = ({
  children,
  matchRequest,
}: {
  children: ReactNode;
  matchRequest: MatchRequest;
}) => {
  const { problem, friend, isSent } = matchRequest;
  const matchRequestStatus = getMatchRequestStatus(matchRequest);
  const {
    icon: StatusIcon,
    text: statusText,
    date: statusDate,
    cta: CTA,
  } = getMatchRequestStatusContent(matchRequestStatus, matchRequest);

  const matchDetails = [
    {
      label: "Language",
      data: (
        <Badge variant="secondary" className="rounded-md">
          {formatProgrammingLanguage(problem.programmingLanguage)}
        </Badge>
      ),
    },
    {
      label: "Difficulty",
      data: getDifficultyBadge(problem.difficultyLevel, "rounded-md"),
    },
    {
      label: "Time Limit",
      data: (
        <span className="text-base font-semibold">
          {matchRequest.timeLimit
            ? getDuration(undefined, undefined, matchRequest.timeLimit)
            : "No time limit"}
        </span>
      ),
    },
  ];

  const timeline = [
    {
      icon: ClockIcon,
      label: "Created",
      data: formatTime(matchRequest.createdAt),
    },
    {
      icon: StatusIcon,
      label: statusText,
      data: formatTime(statusDate),
    },
    matchRequest.matchResult
      ? {
          icon: FlagIcon,
          label: "Finished",
          data: formatTime(matchRequest.matchResult?.createdAt),
        }
      : null,
  ];

  return (
    <Dialog>
      <DialogTrigger asChild className="w-full min-w-0">
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {problem.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Match request description
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4 w-full min-w-0 p-4 rounded-md border border-border">
          <UserAvatar {...friend} className="size-18" textClassName="text-xl" />
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-base font-medium text-muted-foreground tracking-wider">
              {isSent ? "SENT TO" : "RECEIVED FROM"}
            </span>
            <span className="text-xl font-semibold truncate">
              {friend.name}
            </span>
            <span className="text-base font-medium truncate">
              {friend.email}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-4">
          <div className="flex flex-col gap-4 w-full min-w-0">
            <MarkdownRenderer>{problem.description}</MarkdownRenderer>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border p-4 flex flex-col gap-6 h-fit">
              <CTA />
            </div>
            <div className="rounded-md border border-border p-4 flex flex-col gap-6 h-fit">
              <div className="flex flex-col gap-4">
                <h2 className="text-base font-medium tracking-wider">
                  MATCH DETAILS
                </h2>
                <div className="flex flex-col gap-2 w-full">
                  {matchDetails.map((detail) => (
                    <div
                      key={detail.label}
                      className="w-full flex items-center gap-2 justify-between"
                    >
                      <span className="text-base text-muted-foreground">
                        {detail.label}
                      </span>
                      {detail.data}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h2 className="text-base font-medium tracking-wider">
                  CONCEPTS
                </h2>
                {problem.concepts.length ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {problem.concepts.map((concept) => (
                      <Badge key={concept} variant="outline">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <span className="text-center text-base font-medium text-muted-foreground">
                      No concepts
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <h2 className="text-base font-medium tracking-wider">
                  TIMELINE
                </h2>
                <div className="flex flex-col gap-2">
                  {timeline
                    .filter(
                      (item): item is NonNullable<typeof item> => item != null,
                    )
                    .map((event, index) => (
                      <Fragment key={index}>
                        <div className="flex items-center gap-2 last:mb-2">
                          <event.icon className="size-5" />
                          <span className="text-base">
                            {event.label}:{" "}
                            <span className="font-medium">{event.data}</span>
                          </span>
                        </div>
                        <div className="w-0.5 h-6 bg-border rounded last:hidden ml-2" />
                      </Fragment>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
