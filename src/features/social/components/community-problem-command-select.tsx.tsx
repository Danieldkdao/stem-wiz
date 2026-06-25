"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getDifficultyBadge } from "@/features/oracle/lib/formatters";
import { useAuthSession } from "@/hooks/use-auth-session";
import { DEFAULT_PAGE } from "@/lib/constants";
import { cn, getShortenedConcepts } from "@/lib/utils";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronsUpDownIcon,
  HistoryIcon,
  Loader2Icon,
  UserIcon,
} from "lucide-react";
import { ComponentProps, useEffect, useState, useTransition } from "react";
import { getCommunityProblemsAction } from "../actions/actions";
import { formatProgrammingLanguage } from "../lib/formatters";
import { NotFound } from "@/components/not-found";
import { formatDateStringWithAgo } from "@/features/matches/lib/formatters";

type CommunityProblems = Awaited<
  ReturnType<typeof getCommunityProblemsAction>
>["communityProblems"];

export const CommunityProblemCommandSelect = ({
  value,
  onValueChange,
  problemTitle,
  onClick,
  className,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
  problemTitle: string | null | undefined;
} & ComponentProps<typeof Button>) => {
  const { data: session } = useAuthSession();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(value);
  const [communityProblems, setCommunityProblems] = useState<CommunityProblems>(
    [],
  );
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(DEFAULT_PAGE - 1);
  const [isInfinitePending, startInfiniteTransition] = useTransition();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  const handleSearch = () => {
    if (!session) return;
    startSearchTransition(async () => {
      const { communityProblems, metadata } = await getCommunityProblemsAction(
        session.user.id,
        { search, page: DEFAULT_PAGE, ...defaultFilterOptions },
      );

      setCommunityProblems(communityProblems);
      setPage(DEFAULT_PAGE);
      setHasNextPage(metadata.hasNextPage);
    });
  };
  const handleDebouncedSearch = useDebouncedCallback(handleSearch, {
    wait: 300,
  });

  const defaultFilterOptions = {
    difficulty: [],
    languages: [],
    sortBy: "most_recent" as const,
    statuses: [],
  };

  const selectedProblem = communityProblems.find(
    (problem) => problem.id === selectedProblemId,
  );

  useEffect(() => {
    if (!sentinelEl || isInfinitePending || !hasNextPage || !session || !open)
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startInfiniteTransition(async () => {
          const nextPage = page + 1;

          const { communityProblems, metadata } =
            await getCommunityProblemsAction(session.user.id, {
              search,
              page: nextPage,
              ...defaultFilterOptions,
            });

          setCommunityProblems((prev) => [...prev, ...communityProblems]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      {
        root: containerEl,
        rootMargin: "400px",
      },
    );

    observer.observe(sentinelEl);

    return () => observer.disconnect();
  }, [
    hasNextPage,
    sentinelEl,
    containerEl,
    page,
    isInfinitePending,
    session,
    open,
  ]);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "flex items-center gap-2 justify-start w-full min-w-0",
          className,
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        {problemTitle || selectedProblem ? (
          <span className="text-left flex-1 min-w-0 truncate">
            {problemTitle?.trim()
              ? problemTitle
              : selectedProblem
                ? selectedProblem.problem.title
                : "Select a community problem"}
          </span>
        ) : (
          <span className="text-muted-foreground text-left flex-1 min-w-0 truncate">
            Select a community problem...
          </span>
        )}
        <ChevronsUpDownIcon className="text-muted-foreground" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="md:max-w-4xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={(search) => {
              setSearch(search);
              handleDebouncedSearch();
            }}
            placeholder="Search by title, description, author name, or concepts..."
          />
          <CommandList ref={setContainerEl}>
            {!isSearchPending && communityProblems.length ? (
              <CommandGroup className="mt-2">
                <div className="flex flex-col gap-2">
                  {communityProblems.map((cp) => {
                    const { problem, ...communityProblem } = cp;
                    const isSelected =
                      selectedProblemId === communityProblem.id;

                    return (
                      <CommandItem
                        key={communityProblem.id}
                        value={communityProblem.id}
                        onSelect={(communityProblemId) => {
                          setSelectedProblemId(communityProblemId);
                          onValueChange(communityProblemId);
                          setOpen(false);
                        }}
                        className={cn(isSelected && "bg-accent/15!")}
                        showCheckIcon={false}
                      >
                        <div className="flex flex-col gap-2 w-full min-w-0">
                          <div className="w-full min-w-0 flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 w-full min-w-0">
                              <span className="text-lg font-semibold">
                                {problem.title}
                              </span>
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="py-1 px-2 h-6 rounded-md"
                                >
                                  {formatProgrammingLanguage(
                                    problem.programmingLanguage,
                                  )}
                                </Badge>
                                {getDifficultyBadge(
                                  problem.difficultyLevel,
                                  "py-1 px-2 h-6 rounded-md",
                                )}
                              </div>
                            </div>

                            <span className="truncate text-muted-foreground text-sm">
                              {problem.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-between w-full flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <UserIcon className="size-4 text-muted-foreground!" />
                                <span className="text-muted-foreground font-medium group-hover:text-muted-foreground!">
                                  {communityProblem.author.name}
                                </span>
                              </div>
                              <span className="text-muted-foreground font-medium">
                                •
                              </span>
                              <div className="flex items-center gap-1">
                                <HistoryIcon className="size-4 text-muted-foreground!" />
                                <span className="text-muted-foreground font-medium group-hover:text-muted-foreground!">
                                  {formatDateStringWithAgo(
                                    formatDistanceToNow(
                                      communityProblem.updatedAt,
                                    ),
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {getShortenedConcepts(problem.concepts).map(
                                (concept, index) => (
                                  <Badge
                                    key={`${concept}-${index}`}
                                    variant={
                                      concept.variant === "outline" &&
                                      isSelected
                                        ? "default"
                                        : concept.variant
                                    }
                                    className={cn(
                                      "py-1 px-2 rounded-md",
                                      concept.variant === "outline" &&
                                        isSelected &&
                                        "bg-accent/75",
                                    )}
                                  >
                                    {concept.concept}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            ) : !isInfinitePending && !isSearchPending ? (
              <NotFound
                title="No community problems found"
                description="We were unable to find any community problems that match the search terms above. Try adjusting your query to be more specific."
              />
            ) : null}
            {(isInfinitePending || isSearchPending) && (
              <div className="flex items-center justify-center w-full my-2">
                <Loader2Icon className="text-primary animate-spin" />
              </div>
            )}
            <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};
