import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { CommunityProblemTable, ProblemTable } from "@/db/schema";
import { getDifficultyBadge } from "@/features/oracle/lib/formatters";
import { User } from "@/lib/auth/auth";
import { formatShortDate } from "@/lib/utils";
import {
  formatCommunityProblemStatus,
  formatProgrammingLanguage,
  getVisibilityStatusIcon,
} from "../lib/formatters";
import { CodeIcon } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import Link from "next/link";

export const CommunityProblemCard = ({
  communityProblem,
}: {
  communityProblem: typeof CommunityProblemTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
    author: User;
  };
}) => {
  const problem = communityProblem.problem;
  const author = communityProblem.author;

  return (
    <Link
      href={`/community/problems/${communityProblem.id}`}
      className="w-full h-full"
    >
      <Card className="h-full w-full">
        <CardContent className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">{problem.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <UserAvatar
              {...author}
              className="size-6"
              textClassName="text-xs"
            />
            <span className="text-base">by {author.name}</span>
            <span className="text-base font-medium">•</span>
            <span className="text-base">
              {formatShortDate(communityProblem.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {getDifficultyBadge(problem.difficultyLevel)}
            <Badge variant="secondary">
              <CodeIcon />
              {formatProgrammingLanguage(problem.programmingLanguage)}
            </Badge>
            <Badge>
              {getVisibilityStatusIcon(communityProblem.status)}
              {formatCommunityProblemStatus(communityProblem.status).label}
            </Badge>
          </div>
          <MarkdownRenderer className="line-clamp-4">
            {problem.description}
          </MarkdownRenderer>
          <div className="flex items-center gap-2 flex-wrap">
            {problem.concepts.map((concept, index) => (
              <Badge key={index} variant="outline" className="rounded-sm">
                {concept}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
