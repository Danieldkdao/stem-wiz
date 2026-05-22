import { BellIcon, CodeIcon } from "lucide-react";
import { Button } from "./ui/button";
import { TooltipWrapper } from "./tooltip-wrapper";

export const Header = () => {
  return (
    <nav className="flex w-full items-center gap-2 p-4 bg-card border-b justify-between">
      <div className="flex items-center gap-2">
        <CodeIcon className="text-primary" />
        <span className="text-xl font-semibold text-primary">Synapse</span>
      </div>
      <div className="flex items-center gap-2">
        <TooltipWrapper content="Your notifications" align="end">
          <Button variant="ghost" size="icon">
            <BellIcon />
          </Button>
        </TooltipWrapper>
      </div>
    </nav>
  );
};
