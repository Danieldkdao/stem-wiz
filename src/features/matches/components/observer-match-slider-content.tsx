import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArenaProblemTable, MatchTable } from "@/db/schema";
import { ArenaProblemDetails } from "@/features/arena-problems/components/arena-problem-details";
import { MatchChatInput } from "@/features/chats/components/match-chat-input";
import { MatchChatMessageList } from "@/features/chats/components/match-chat-message-list";
import { InfoIcon, MessageSquareIcon } from "lucide-react";

export const ObserverMatchSliderContent = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect & {
    arenaProblem: typeof ArenaProblemTable.$inferSelect;
  };
}) => {
  return (
    <SheetContent side="left" showCloseButton={false}>
      <SheetHeader className="sr-only">
        <SheetTitle>Match Details</SheetTitle>
        <SheetDescription>
          View match details and observer chat.
        </SheetDescription>
      </SheetHeader>
      <div className="w-full h-full p-4">
        <Tabs
          defaultValue="problem-info"
          className="flex flex-col min-h-0 gap-4 h-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="problem-info">
              <InfoIcon />
              Problem Info
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquareIcon />
              Chat
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="problem-info"
            className="w-full h-full overflow-auto"
          >
            <ArenaProblemDetails arenaProblem={match.arenaProblem} />
          </TabsContent>
          <TabsContent value="chat" className="min-h-0 w-full overflow-hidden">
            <div className="w-full h-full min-h-0 overflow-hidden flex flex-col gap-2">
              <MatchChatMessageList />
              <MatchChatInput matchId={match.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  );
};
