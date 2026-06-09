import { CommunityExploreView } from "@/features/user/components/views/community-explore-view";
import { CommunityParams } from "@/features/user/lib/types";

const CommunityPage = (props: CommunityParams) => {
  return <CommunityExploreView {...props} />;
};

export default CommunityPage;
