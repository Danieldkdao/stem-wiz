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
        "ring-0 border-4 border-dashed border-destructive w-full bg-destructive/20!",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2 items-center">
        <CircleXIcon className="text-destructive size-10" />
        <h2 className="text-2xl font-semibold text-center text-destructive">
          {title}
        </h2>
        <p className="text-destructive text-lg text-center max-w-150">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
