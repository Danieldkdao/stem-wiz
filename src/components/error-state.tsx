import { CircleXIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

export const ErrorState = ({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) => {
  return (
    <Card
      className={cn(
        "ring-0 border-4 bg-dashed border-destructive w-full",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2">
        <CircleXIcon className="text-destructive size-10" />
        <h2 className="text-2xl font-semibold text-center text-destructive">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg text-center max-w-150">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
