"use client";

import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { ResizablePanel } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatMessageTable, ChatTable, OracleProblemTable } from "@/db/schema";
import { TabValue, useOracleStore } from "@/store/use-oracle-store";
import { CircleXIcon, Loader2Icon, MessageSquareDotIcon } from "lucide-react";
import { OracleSessionChat } from "./oracle-session-chat";

export const OraclePanel = ({
  problem,
}: {
  problem: typeof OracleProblemTable.$inferSelect & {
    chat:
      | (typeof ChatTable.$inferSelect & {
          messages: (typeof ChatMessageTable.$inferSelect)[];
        })
      | null;
  };
}) => {
  const feedbackGenerationStatus = useOracleStore(
    (state) => state.feedbackGenerationStatus,
  );
  const tabValue = useOracleStore((state) => state.tabValue);
  const setTabValue = useOracleStore((state) => state.setTabValue);

  return (
    <ResizablePanel minSize="25%" className="p-5 h-full">
      <Tabs
        defaultValue="chat"
        value={tabValue}
        onValueChange={(value) => setTabValue(value as TabValue)}
        className="w-full h-full flex flex-col gap-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <div className="flex-1 w-full overflow-y-auto">
          <TabsContent value="chat" className="h-full w-full">
            <OracleSessionChat
              chat={problem.chat}
              sessionId={problem.sessionId}
              problemId={problem.id}
            />
          </TabsContent>
          <TabsContent value="feedback" className="h-full w-full">
            {feedbackGenerationStatus === "generating" ? (
              <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                <Loader2Icon className="animate-spin" />
                <h2 className="text-xl font-semibold text-center">
                  Feedback generation in progress...
                </h2>
              </div>
            ) : feedbackGenerationStatus === "error" ? (
              <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                <CircleXIcon className="text-destructive" />
                <h2 className="text-xl font-semibold text-center text-destructive">
                  Failed to generate feedback
                </h2>
                <p className="text-center max-w-100 text-destructive">
                  Oops. Unfortunately, something unexpected occurred while we
                  were generating your feedback. At this time, there is
                  currently no mechanism in place to regenerate this feedback.
                  We plan to implement this feature soon.
                </p>
              </div>
            ) : problem.feedback ? (
              <MarkdownRenderer>{problem.feedback}</MarkdownRenderer>
            ) : (
              <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                <MessageSquareDotIcon />
                <h2 className="text-xl font-semibold text-center">
                  No Feedback Yet
                </h2>
                <p className="text-muted-foreground text-center max-w-100">
                  No feedback has been generated for this problem yet. To see
                  the feedback, complete and submit your solution.
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </ResizablePanel>
  );
};
