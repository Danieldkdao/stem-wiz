import { Loader2Icon } from "lucide-react";

type ObserverCodeOutputProps = {
  output?: string | null;
  error?: string | null;
  isRunning: boolean;
};

export const ObserverCodeOutput = ({
  output,
  error,
  isRunning,
}: ObserverCodeOutputProps) => {
  return (
    <div className="flex flex-col bg-card/75 h-full">
      <div className="px-5 py-4 bg-card border-b flex items-center justify-between">
        <span className="text-base font-medium text-muted-foreground">
          Output
        </span>
        {isRunning && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Running...
            </span>
            <Loader2Icon className="animate-spin text-muted-foreground size-5" />
          </div>
        )}
      </div>

      <div className="p-5 font-mono overflow-y-auto flex-1">
        {error ? (
          <div className="flex flex-col gap-1">
            <span className="text-destructive">Error Running Code</span>
            <pre className="text-destructive text-wrap">{error}</pre>
          </div>
        ) : (
          <pre className="text-wrap">{output}</pre>
        )}
      </div>
    </div>
  );
};
