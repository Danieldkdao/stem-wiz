import { CommandFooter } from "@/components/dashboard/command-footer";
import { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="pb-20">
      {children}
      <CommandFooter />
    </div>
  );
};

export default DashboardLayout;
