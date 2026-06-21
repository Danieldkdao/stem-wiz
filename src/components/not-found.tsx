import { cn } from "@/lib/utils";
import { SearchXIcon } from "lucide-react";
import { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

export const NotFound = ({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <Card className="ring-0 border-4 border-dashed">
      <CardContent
        className={cn("flex flex-col gap-2 items-center", className)}
      >
        <SearchXIcon className="size-10" />
        <h2 className="text-2xl font-semibold text-center">{title}</h2>
        <p className="text-lg text-muted-foreground text-center max-w-150">
          {description}
        </p>
        <div className="w-full mx-auto max-w-150">{children}</div>
      </CardContent>
    </Card>
  );
};
