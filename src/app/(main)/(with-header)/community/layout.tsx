import { CommunityTabLinks } from "@/features/social/components/community-tab-links";
import { ReactNode, Suspense } from "react";

const CommunityLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto py-10 px-6 h-full">
      <Suspense>
        <CommunityTabLinks />
      </Suspense>
      <div className="w-full min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

export default CommunityLayout;
