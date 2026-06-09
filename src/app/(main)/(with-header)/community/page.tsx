import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityExploreView } from "@/features/user/components/community-explore-view";
import { CommunityParams } from "@/features/user/lib/types";
import { MessagesSquareIcon, SparklesIcon, UsersIcon } from "lucide-react";

const CommunityPage = (props: CommunityParams) => {
  return (
    <div className="flex flex-col items-center gap-8 h-full overflow-y-auto w-full pb-20 pt-20 px-10">
      <Tabs className="w-full max-w-7xl mx-auto" defaultValue="explore">
        <TabsList className="w-full h-11">
          <TabsTrigger value="explore">
            <UsersIcon />
            Explore
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessagesSquareIcon />
            Chat
          </TabsTrigger>
          <TabsTrigger value="ai-discover">
            <SparklesIcon />
            AI Discover
          </TabsTrigger>
        </TabsList>
        <TabsContent value="explore">
          <CommunityExploreView {...props} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityPage;
