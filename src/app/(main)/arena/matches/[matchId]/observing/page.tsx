import { ErrorState } from "@/components/error-state";
import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMatchChatMessagesAction } from "@/features/chats/actions/actions";
import {
  checkExistingMatchAction,
  checkExistingParticipant,
} from "@/features/matches/actions/actions";
import { ObservableMatchView } from "@/features/matches/components/observable-match-view";
import {
  DEFAULT_PAGE,
  NUMBER_OF_ALLOWED_MATCH_PARTICIPANTS,
} from "@/lib/constants";
import { ParamsId } from "@/lib/types";
import { Suspense } from "react";

type MatchObservingProps = ParamsId<"matchId">;

const MatchObservingPage = (props: MatchObservingProps) => {
  return (
    <Suspense fallback={<MatchObservingLoading />}>
      <MatchObservingSuspense {...props} />
    </Suspense>
  );
};

const MatchObservingLoading = () => {
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full py-4 grid grid-cols-3 border-b bg-background/50 px-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9" />
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
        <div className="w-full flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <div className="flex justify-end items-center">
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="min-h-0 w-full flex-1 grid grid-cols-1 lg:grid-cols-2">
        <ObserverPanelSkeleton />
        <ObserverPanelSkeleton mirrored />
      </div>
    </div>
  );
};

const ObserverPanelSkeleton = ({ mirrored }: { mirrored?: boolean }) => {
  return (
    <div className="bg-card/75 flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r last:border-r-0">
      <div
        className={`p-4 border-b flex items-center gap-4 w-full min-w-0 ${
          mirrored ? "flex-row-reverse" : ""
        }`}
      >
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div
          className={`flex flex-1 min-w-0 flex-col gap-2 ${
            mirrored ? "items-end" : ""
          }`}
        >
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>

      <div className="min-h-0 flex-1 grid grid-rows-2">
        <div className="min-h-0 border-b bg-background">
          <div className="flex h-10 items-center gap-2 border-b px-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-9/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-8/12" />
          </div>
        </div>

        <div className="min-h-0 bg-card/60">
          <div className="flex h-12 items-center justify-between border-b px-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-7/12" />
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchObservingSuspense = async ({ params }: MatchObservingProps) => {
  const { matchId } = await params;
  const match = await checkExistingMatchAction({ id: matchId });

  const userMatch = await checkExistingParticipant(matchId);
  if (userMatch) {
    return (
      <div className="w-full h-full py-10 px-6">
        <ErrorState
          title="Hold on right there."
          description="You are currently participating in this match. In the spirit of good sportsmanship, please go back and finish the match."
        >
          <Button className="mt-2 w-full">Resume match</Button>
        </ErrorState>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="w-full h-full py-10 px-6">
        <NotFound
          title="Match not found"
          description="We weren't able to find that match. Try checking the url or refreshing the page."
        />
      </div>
    );
  }

  if (
    match.users.length < NUMBER_OF_ALLOWED_MATCH_PARTICIPANTS ||
    match.users.length > NUMBER_OF_ALLOWED_MATCH_PARTICIPANTS
  ) {
    return (
      <div className="w-full h-full py-10 px-6">
        <ErrorState
          title="An error occurred"
          description="Something went wrong that prevented the match from loading. Try refreshing the page or reloading the page."
        >
          <Button className="mt-2 w-full">Resume match</Button>
        </ErrorState>
      </div>
    );
  }

  const response = await getMatchChatMessagesAction(match.id, DEFAULT_PAGE);
  if (!response) {
    return (
      <div className="w-full h-full py-10 px-6">
        <ErrorState
          title="Match failed to load"
          description="We were unable to load this match. Try checking the url to see if you have the right one or simply try refreshing the page."
        />
      </div>
    );
  }

  const { chatMessages, metadata } = response;

  return (
    <ObservableMatchView
      match={match}
      initialMessages={chatMessages}
      initialHasNextPage={metadata.hasNextPage}
    />
  );
};

export default MatchObservingPage;
