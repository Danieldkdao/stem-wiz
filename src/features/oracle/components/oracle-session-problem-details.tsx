import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { ResizablePanel } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { OracleProblemTable } from "@/db/schema";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";

export const OracleSessionProblemDetails = ({
  problem,
}: {
  problem: typeof OracleProblemTable.$inferSelect;
}) => {
  return (
    <ResizablePanel minSize="20%" className="p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{problem.title}</h1>

        <div className="flex items-center gap-2">
          <Badge>{formatDifficultyLevel(problem.difficulty)}</Badge>
          <Badge>{formatProgrammingLanguage(problem.language)}</Badge>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium text-muted-foreground">
            Concepts
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {problem.concepts.map((concept) => (
              <Badge key={concept} variant="secondary" className="capitalize">
                {concept}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <Separator />
      <MarkdownRenderer isClient>{problem.description}</MarkdownRenderer>
    </ResizablePanel>
  );
};
