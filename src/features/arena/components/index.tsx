import { SocketStatus } from "@/lib/types";
import { Loader2Icon, XIcon } from "lucide-react";
import { ReactNode } from "react";

export const statusMap: Record<
  SocketStatus,
  {
    label: string;
    element: ReactNode;
  }
> = {
  closed: {
    label: "Disconnected",
    element: <XIcon className="size-4 text-destructive shrink-0" />,
  },
  connecting: {
    label: "Connecting",
    element: (
      <Loader2Icon className="size-4 shrink-0 text-muted-foreground animate-spin" />
    ),
  },
  error: {
    label: "Disconnected",
    element: <XIcon className="size-4 text-destructive shrink-0" />,
  },
  idle: {
    label: "Disconnected",
    element: (
      <div className="size-4 rounded-full bg-muted-foreground shrink-0" />
    ),
  },
  open: {
    label: "Connected",
    element: (
      <div className="relative">
        <div className="bg-primary/80 size-4 rounded-full shrink-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-4 rounded-full shrink-0 bg-primary/50 animate-ping duration-300" />
        </div>
      </div>
    ),
  },
};
