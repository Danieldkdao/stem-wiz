import { BellIcon, CodeIcon } from "lucide-react";
import { TooltipWrapper } from "./tooltip-wrapper";
import { Button } from "./ui/button";

export const Header = () => {
  return (
    <nav className="flex w-full items-center gap-2 p-4 bg-card border-b justify-between">
      <div className="flex items-center gap-2">
        <CodeIcon className="text-primary" />
        <span className="text-xl font-semibold text-primary">Synapse</span>
      </div>
      <div className="flex items-center gap-2">
        <TooltipWrapper content="Your notifications" align="end">
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="size-6!" />
            <span className="absolute size-5 rounded-full bg-destructive text-white font-semibold -top-1 text-sm -right-1 flex items-center justify-center">
              1
            </span>
          </Button>
        </TooltipWrapper>
      </div>
    </nav>
  );
};
