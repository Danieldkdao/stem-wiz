import { SearchXIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

export const NotFound = ({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
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
      </CardContent>
    </Card>
  );
};
