"use client";

import { ComponentProps } from "react";
import { ResizablePanelGroup } from "./ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";

export const ResizablePanelMobileGroup = ({
  children,
  ...props
}: ComponentProps<typeof ResizablePanelGroup>) => {
  const isMobile = useIsMobile();

  return (
    <ResizablePanelGroup
      orientation={isMobile ? "vertical" : "horizontal"}
      {...props}
    >
      {children}
    </ResizablePanelGroup>
  );
};
