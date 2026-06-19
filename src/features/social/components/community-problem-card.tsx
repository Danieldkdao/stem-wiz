import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { CommunityProblemTable, ProblemTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { formatShortDate } from "@/lib/utils";
import Link from "next/link";
import { CommunityProblemBadges } from "./community-problem-badges";

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
    <Card className="h-full w-full min-w-0">
      <CardContent className="flex flex-col gap-4 min-w-0">
        <Link
          href={`/community/problems/${communityProblem.id}`}
          className="w-full min-w-0"
        >
          <h2 className="text-2xl font-semibold truncate w-full min-w-0">
            {problem.title}
          </h2>
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <UserAvatar {...author} className="size-6" textClassName="text-xs" />
          <span className="text-base">by {author.name}</span>
          <span className="text-base font-medium">•</span>
          <span className="text-base">
            {formatShortDate(communityProblem.createdAt)}
          </span>
        </div>
        <CommunityProblemBadges
          difficultyLevel={problem.difficultyLevel}
          programmingLanguage={problem.programmingLanguage}
          status={communityProblem.status}
        />
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
  );
};
