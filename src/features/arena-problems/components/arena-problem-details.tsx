import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArenaProblemTable } from "@/db/schema";
import { formatProgrammingLanguage } from "@/features/user/lib/formatters";
import { formatDifficultyLevel } from "../lib/formatters";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

export const ArenaProblemDetails = ({
  arenaProblem,
}: {
  arenaProblem: typeof ArenaProblemTable.$inferSelect;
}) => {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">{arenaProblem.title}</h1>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Badge>
          {formatProgrammingLanguage(arenaProblem.programmingLanguage)}
        </Badge>
        <Badge>{formatDifficultyLevel(arenaProblem.difficultyLevel)}</Badge>
      </div>
      <Separator />
      <MarkdownRenderer>{arenaProblem.description}</MarkdownRenderer>
    </div>
  );
};
