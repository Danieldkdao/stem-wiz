import { MatchInvitationTabLinks } from "@/features/matches/components/match-invitation-tab-links";
import { ReactNode, Suspense } from "react";

const MatchInvitationsLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto pt-10 px-6 h-full">
      <Suspense>
        <MatchInvitationTabLinks />
      </Suspense>
      <div className="w-full min-h-0 flex-1 overflow-y-auto pb-10">
        {children}
      </div>
    </div>
  );
};

export default MatchInvitationsLayout;
