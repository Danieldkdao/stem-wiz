import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArenaProblemTable, MatchTable } from "@/db/schema";
import { ArenaProblemDetails } from "@/features/arena-problems/components/arena-problem-details";
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
      <div className="w-full h-full overflow-y-auto p-4">
        <Tabs defaultValue="problem-info" className="flex flex-col gap-4">
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
          <TabsContent value="problem-info">
            <ArenaProblemDetails isClient arenaProblem={match.arenaProblem} />
          </TabsContent>
          <TabsContent value="chat">this is the chat tab</TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  );
};
