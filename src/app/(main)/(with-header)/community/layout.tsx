import { CommunityTabLinks } from "@/features/user/components/community-tab-links";
import { ReactNode, Suspense } from "react";

const CommunityLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto py-10 px-6 h-full">
      <Suspense>
        <CommunityTabLinks />
      </Suspense>
      <div className="w-full flex-1">{children}</div>
    </div>
  );
};

export default CommunityLayout;
