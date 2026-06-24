import { CommunityTabLinks } from "@/features/social/components/community-tab-links";
import { ReactNode, Suspense } from "react";

const CommunityLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="pt-10 px-6 h-full w-full">
      <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
        <Suspense>
          <CommunityTabLinks />
        </Suspense>
        <div className="w-full min-h-0 flex-1 overflow-y-auto pb-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CommunityLayout;
