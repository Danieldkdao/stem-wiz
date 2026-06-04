import { Card, CardContent } from "@/components/ui/card";
import { SearchXIcon } from "lucide-react";

export const OracleSessionNotFound = () => {
  return (
    <Card className="w-full border-4 border-border border-dashed">
      <CardContent className="flex flex-col gap-2 items-center">
        <SearchXIcon className="size-10" />
        <h1 className="text-center text-2xl font-semibold">
          Session not found
        </h1>
        <p className="text-center max-w-150 text-muted-foreground text-lg">
          We were unable to find that session you looking for. Try reloading the
          page or going to a different address.
        </p>
      </CardContent>
    </Card>
  );
};
