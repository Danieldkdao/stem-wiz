import { Header } from "@/components/dashboard/header";
import { ReactNode } from "react";

const WithHeaderLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <Header />
      <div className="w-full flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

export default WithHeaderLayout;
