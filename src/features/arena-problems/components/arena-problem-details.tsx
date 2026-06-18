import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProblemTable } from "@/db/schema";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";
import { formatDifficultyLevel } from "../lib/formatters";

export const ArenaProblemDetails = ({
  problem,
}: {
  problem: typeof ProblemTable.$inferSelect;
}) => {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">{problem.title}</h1>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Badge>{formatProgrammingLanguage(problem.programmingLanguage)}</Badge>
        <Badge>{formatDifficultyLevel(problem.difficultyLevel)}</Badge>
      </div>
      <Separator />
      <MarkdownRenderer>{problem.description}</MarkdownRenderer>
    </div>
  );
};
