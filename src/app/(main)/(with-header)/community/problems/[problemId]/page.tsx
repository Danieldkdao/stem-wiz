import { LinkButton } from "@/components/link-button";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { NotFound } from "@/components/not-found";
import { RefreshPageButton } from "@/components/refresh-page-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import {
  getCommunityProblemAction,
  hasPermissionToViewCommunityProblemAction,
} from "@/features/social/actions/actions";
import { CommunityProblemBadges } from "@/features/social/components/community-problem-badges";
import { CommunityProblemDialog } from "@/features/social/components/community-problem-dialog";
import { DeleteCommunityProblemButton } from "@/features/social/components/delete-community-problem-button";
import {
  formatCommunityProblemStatus,
  formatProgrammingLanguage,
} from "@/features/social/lib/formatters";
import { getCurrentUser } from "@/lib/auth/helpers";
import { cn, formatShortDate } from "@/lib/utils";
import {
  CalendarIcon,
  CodeIcon,
  EditIcon,
  EyeIcon,
  FileTextIcon,
  GaugeCircleIcon,
  HistoryIcon,
  InfoIcon,
  PlayIcon,
  SquareArrowOutUpRightIcon,
  TagsIcon,
  Trash2Icon,
  UserCircleIcon,
} from "lucide-react";
import { Suspense } from "react";

type ProblemIdParams = { params: Promise<{ problemId: string }> };

const ProblemIdPage = (props: ProblemIdParams) => {
  return (
    <Suspense fallback={<ProblemIdLoading />}>
      <ProblemIdSuspense {...props} />
    </Suspense>
  );
};

const ProblemIdLoading = () => {
  return (
    <div className="w-full flex flex-col gap-6 min-w-0 pt-4">
      <Skeleton className="h-11 w-full max-w-2xl" />
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Separator orientation="vertical" className="bg-muted-foreground/60" />
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-4 w-full min-w-0">
        <Card className="border-t-4 border-t-primary">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 shrink-0" />
              <Skeleton className="h-8 w-64 max-w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-10/12" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-9/12" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="mt-2 h-32 w-full rounded-lg" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-8/12" />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4 w-full min-w-0">
          <Skeleton className="h-11 w-full rounded-md" />
          <Card className="border-t-4 border-t-primary">
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 shrink-0" />
                <Skeleton className="h-8 w-48 max-w-full" />
              </div>
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-5 shrink-0" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-primary">
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 shrink-0" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-primary w-full min-w-0">
            <CardContent className="flex flex-col gap-6 w-full min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 shrink-0" />
                <Skeleton className="h-8 w-56 max-w-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <div className="flex flex-col gap-2 flex-1 w-full min-w-0">
                  <Skeleton className="h-7 w-44 max-w-full" />
                  <Skeleton className="h-5 w-56 max-w-full" />
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ProblemIdSuspense = async ({ params }: ProblemIdParams) => {
  const { userId } = await getCurrentUser();
  const { problemId } = await params;

  if (!(await hasPermissionToViewCommunityProblemAction(problemId))) {
    return (
      <div className="py-10">
        <NotFound
          title="Not found"
          description="We weren't able to find this commumity problem. Try checking the url or refresh the page. The problem also might have been deleted by the author."
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <LinkButton
              href="/community/problems"
              variant="outline"
              className="w-full md:flex-1"
            >
              Back to community problems
            </LinkButton>
            <RefreshPageButton className="w-full md:flex-1">
              Reload the page
            </RefreshPageButton>
          </div>
        </NotFound>
      </div>
    );
  }

  const response = await getCommunityProblemAction(problemId);
  if (!response) {
    return (
      <div className="py-10">
        <NotFound
          title="Not found"
          description="We weren't able to find this commumity problem. Try checking the url or refresh the page. The problem also might have been deleted by the author."
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <LinkButton
              href="/community/problems"
              variant="outline"
              className="w-full md:flex-1"
            >
              Back to community problems
            </LinkButton>
            <RefreshPageButton className="w-full md:flex-1">
              Reload the page
            </RefreshPageButton>
          </div>
        </NotFound>
      </div>
    );
  }

  const {
    author: { profile, ...author },
    problem,
    ...communityProblem
  } = response;

  const problemDetails = [
    {
      icon: GaugeCircleIcon,
      label: "Difficulty",
      data: formatDifficultyLevel(problem.difficultyLevel),
    },
    {
      icon: CodeIcon,
      label: "Language",
      data: formatProgrammingLanguage(problem.programmingLanguage),
    },
    {
      icon: EyeIcon,
      label: "Visibility",
      data: formatCommunityProblemStatus(communityProblem.status).label,
    },
    {
      icon: CalendarIcon,
      label: "Created At",
      data: formatShortDate(communityProblem.createdAt),
    },
    {
      icon: HistoryIcon,
      label: "Updated At",
      data: formatShortDate(communityProblem.updatedAt),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 min-w-0 pt-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <h1 className="text-4xl font-semibold min-w-0 flex-1">
          {problem.title}
        </h1>
        {communityProblem.authorUserId === userId && (
          <div className="flex items-center gap-2">
            <CommunityProblemDialog>
              <Button variant="outline" size="icon">
                <EditIcon />
              </Button>
            </CommunityProblemDialog>
            <DeleteCommunityProblemButton
              communityProblemId={communityProblem.id}
              variant="destructive"
              size="icon"
            >
              <Trash2Icon />
            </DeleteCommunityProblemButton>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <UserAvatar {...author} />
          <span className="text-muted-foreground">
            Posted by{" "}
            <span className="font-medium text-foreground text-base">
              {author.name}
            </span>
          </span>
        </div>
        <Separator orientation="vertical" className="bg-muted-foreground/60" />
        <CommunityProblemBadges
          difficultyLevel={problem.difficultyLevel}
          programmingLanguage={problem.programmingLanguage}
          status={communityProblem.status}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 w-full min-w-0">
        <Card className="border-t-4 border-t-primary">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="text-primary" />
              <h2 className="text-2xl font-semibold">Problem Description</h2>
            </div>
            <MarkdownRenderer>{problem.description}</MarkdownRenderer>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4 w-full min-w-0">
          <LinkButton
            href={`/arena?defaultTab=friend_challenge&selectedProblemId=${communityProblem.id}&problemTitle=${problem.title}`}
            className="h-11 w-full"
          >
            <PlayIcon />
            Use this problem in a match
          </LinkButton>
          <Card className="border-t-4 border-t-primary">
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <InfoIcon className="text-primary" />
                <h2 className="text-2xl font-semibold">Problem Details</h2>
              </div>
              <div className="flex flex-col gap-4">
                {problemDetails.map((detail, index) => {
                  const { label, icon: Icon, data } = detail;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="text-muted-foreground size-5" />
                        <span className="text-muted-foreground text-base">
                          {label}
                        </span>
                      </div>
                      <span className="text-base font-medium">{data}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-primary">
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <TagsIcon className="text-primary" />
                <h2 className="text-2xl font-semibold">Concepts</h2>
              </div>
              {problem.concepts.length ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {problem.concepts.map((concept) => (
                    <Badge key={concept} variant="outline">
                      {concept}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="w-full flex items-center justify-center">
                  <span className="text-center text-base font-medium text-muted-foreground">
                    No concepts
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-primary w-full min-w-0">
            <CardContent className="flex flex-col gap-6 w-full min-w-0">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="text-primary" />
                <h2 className="text-2xl font-semibold">About the author</h2>
              </div>
              <div className="flex flex-col gap-4 w-full min-w-0">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    {...author}
                    className="size-12"
                    textClassName="text-2xl font-medium"
                  />
                  <div className="flex flex-col gap-0.5 flex-1 w-full min-w-0">
                    <span className="text-xl font-semibold truncate">
                      {author.name}
                    </span>
                    <span className="text-base text-muted-foreground truncate">
                      {author.email}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-medium">Bio</h3>
                <p
                  className={cn(
                    "text-muted-foreground line-clamp-2",
                    !profile?.bio && "italic",
                  )}
                >
                  {profile?.bio ?? "This user has not filled in their bio."}
                </p>
              </div>
              <LinkButton
                className="h-10 text-primary hover:text-primary"
                variant="outline"
                href={`/community/users/${author.id}`}
              >
                View full profile
                <SquareArrowOutUpRightIcon className="text-primary" />
              </LinkButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProblemIdPage;
