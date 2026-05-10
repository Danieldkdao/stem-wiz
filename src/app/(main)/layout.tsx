import { CommandFooter } from "@/components/dashboard/command-footer";
import { ReactNode } from "react";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="pb-20 bg-radial w-full h-svh from-primary/10 via-primary/20 to-primary/10">
      {children}
      <CommandFooter />
    </div>
  );
};

export default MainLayout;
