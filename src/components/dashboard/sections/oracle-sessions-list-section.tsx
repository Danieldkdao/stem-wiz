import { ErrorState } from "@/components/error-state";
import { getUserSessionsAction } from "@/features/oracle/actions/actions";
import { getCurrentUser } from "@/lib/auth/helpers";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SparklesIcon } from "lucide-react";
import { Suspense } from "react";
import { DashboardSection } from "../dashboard-section";
import { ResourceRow } from "../resource-row";
import {
  formatOracleSessionMode,
  formatOracleSessionStatus,
} from "@/features/oracle/lib/formatters";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { formatShortDate } from "@/lib/utils";
import { EmptyState } from "../empty-state";
import { CreateUpdateSessionDialog } from "@/features/oracle/components/create-update-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const OracleSessionsListSection = () => {
  return (
    <Suspense fallback={<OracleSessionsListSectionLoading />}>
      <OracleSessionsListSectionSuspense />
    </Suspense>
  );
};

const OracleSessionsListSectionLoading = () => {
  return (
    <DashboardSection
      icon={SparklesIcon}
      title="Oracle Sessions"
      href="/oracle/sessions"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-0 flex-col gap-3 border-b p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-28 shrink-0" />
        </div>
      ))}
    </DashboardSection>
  );
};

const OracleSessionsListSectionSuspense = async () => {
  const { userId } = await getCurrentUser();
  if (!userId)
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );
  const { userSessions } = await getUserSessionsAction(userId, {
    search: "",
    sortBy: "most_recent",
    languages: [],
    statuses: ["active", "upcoming"],
    modes: [],
    page: DEFAULT_PAGE,
  });

  return (
    <DashboardSection
      icon={SparklesIcon}
      title="Oracle Sessions"
      href="/oracle/sessions"
    >
      {userSessions.length ? (
        userSessions.slice(0, 3).map((session) => (
          <ResourceRow
            key={session.id}
            href={
              session.status === "upcoming"
                ? `/oracle/sessions/${session.id}/waiting`
                : `/oracle/sessions/${session.id}`
            }
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-xl font-semibold">
                  {session.title}
                </h3>
                <Badge>{formatOracleSessionStatus(session.status)}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{formatOracleSessionMode(session.mode)}</span>
                <span>/</span>
                <span>
                  {formatProgrammingLanguage(session.programmingLanguage)}
                </span>
                <span>/</span>
                <span>
                  {session.numberOfProblems}{" "}
                  {session.numberOfProblems === 1 ? "problem" : "problems"}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              Updated {formatShortDate(session.updatedAt)}
            </span>
          </ResourceRow>
        ))
      ) : (
        <EmptyState
          icon={SparklesIcon}
          title="No Oracle sessions"
          description="Create a guided practice session for focused feedback."
        >
          <CreateUpdateSessionDialog
            useButton
            size="sm"
            buttonChildren="Start Oracle practice"
          />
        </EmptyState>
      )}
    </DashboardSection>
  );
};
