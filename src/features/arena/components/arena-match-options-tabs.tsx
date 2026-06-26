"use client";

import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { LinkButton } from "@/components/link-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendMatchRequestForm } from "@/features/matches/components/friend-match-request-form";
import { SwordsIcon } from "lucide-react";
import { FaQuestion } from "react-icons/fa6";
import { useArenaParams } from "../hooks/use-arena-params";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const ArenaMatchOptionsTabs = () => {
  return (
    <Suspense fallback={<ArenaMatchOptionsTabsLoading />}>
      <ArenaMatchOptionsTabsSuspense />
    </Suspense>
  );
};

const ArenaMatchOptionsTabsLoading = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b">
        <Skeleton className="h-10 w-36 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-full max-w-180" />
        <Skeleton className="h-7 w-4/5 max-w-140" />
        <div className="flex items-center justify-center gap-6 rounded-md bg-muted p-5">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="size-20 rounded-full" />
            <Skeleton className="h-7 w-12" />
          </div>
          <Skeleton className="size-14" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="size-20 rounded-full" />
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
};

const ArenaMatchOptionsTabsSuspense = () => {
  const [{ defaultTab, selectedProblemId, problemTitle }] = useArenaParams();

  const tabs = [
    {
      value: "random-pairing" as const,
      children: () => (
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-muted-foreground">
            We’ll pair you with a developer who matches your XP level and
            primary programming language from your profile.
          </p>
          <div className="bg-muted rounded-md p-5 flex items-center gap-6 justify-center">
            <div className="flex flex-col items-center gap-2">
              <CurrentUserAvatar className="size-20" textClassName="text-lg" />
              <span className="text-xl font-medium text-center">You</span>
            </div>

            <SwordsIcon className="text-primary size-14" />
            <div className="flex flex-col items-center gap-2">
              <div className="size-20 bg-muted-foreground rounded-full flex items-center justify-center border-2 border-dashed border-border">
                <FaQuestion strokeWidth={5} className="size-10" />
              </div>
              <span className="text-xl font-medium text-center">Opponent</span>
            </div>
          </div>
          <LinkButton href="/arena/waiting">Find a match</LinkButton>
        </div>
      ),
    },
    {
      value: "friend-challenge" as const,
      children: () => (
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-muted-foreground">
            Choose a friend to challenge. Once they accept, both of you will
            enter the match room together.
          </p>
          <FriendMatchRequestForm
            defaultSelectedProblemId={selectedProblemId}
            problemTitle={problemTitle}
          />
        </div>
      ),
    },
  ];

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList variant="line">
        <TabsTrigger value="random-pairing">Random Pairing</TabsTrigger>
        <TabsTrigger value="friend-challenge">Friend Challenge</TabsTrigger>
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {<tab.children />}
        </TabsContent>
      ))}
    </Tabs>
  );
};
