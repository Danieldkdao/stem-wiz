"use client";

import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlusIcon } from "lucide-react";
import { MatchObserverInvitationsForm } from "./match-observer-invitations-form";
import { MatchObserversList } from "./match-observers-list";

export const InviteChatFriendsMatchWidget = ({
  matchId,
}: {
  matchId: string;
}) => {
  // todo: maybe implement chatting functionality in the future?
  return (
    <Popover>
      <TooltipWrapper content="Invite friends to watch" align="end">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="absolute size-14! rounded-full! flex items-center justify-center bottom-4 right-4"
          >
            <UserPlusIcon className="size-6! text-foreground/80" />
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="overflow-y-auto max-h-[calc(100%-10px)] w-80 md:w-100"
      >
        <Tabs defaultValue="invite">
          <div className="flex flex-col gap-4">
            <div>
              <TabsList variant="line">
                <TabsTrigger value="invite">Invite</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
              </TabsList>
              <Separator />
            </div>
            <TabsContent value="invite">
              <MatchObserverInvitationsForm matchId={matchId} />
            </TabsContent>
            <TabsContent value="manage">
              <MatchObserversList matchId={matchId} />
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
