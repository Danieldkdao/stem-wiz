import { CommandFooter } from "@/components/dashboard/command-footer";
import { MatchSocketProvider } from "@/features/matches/hooks/use-match-socket";
import { ReactNode } from "react";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <MatchSocketProvider>
      <div className="bg-radial w-full h-svh from-primary/10 via-primary/20 to-primary/10">
        {children}
        {/* <CommandFooter /> */}
      </div>
    </MatchSocketProvider>
  );
};

export default MainLayout;
