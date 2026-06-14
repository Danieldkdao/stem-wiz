import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { getUserSessionsAction } from "@/features/oracle/actions/actions";
import { CreateUpdateSessionDialog } from "@/features/oracle/components/create-update-session-dialog";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchParams } from "nuqs";
import { loadOracleSessionSearchParams } from "@/features/oracle/lib/params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { OracleSessionInfiniteCardGrid } from "@/features/oracle/components/oracle-session-infinite-card-grid";
import { OracleSessionFilters } from "@/features/oracle/components/oracle-session-filters";

type OracleSessionsListParams = {
  searchParams: Promise<SearchParams>;
};

const OracleSessionsListPage = (props: OracleSessionsListParams) => {
  return (
    <div className="w-full h-full flex flex-col">
      <Header />
      <div className="w-full flex-1 overflow-y-auto">
        <div className="w-full h-full pt-10 px-6 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-3xl font-semibold">Oracle Sessions</h1>
                <p className="text-muted-foreground text-base max-w-150">
                  Review your previous sessions with the oracle, resume a
                  session, or start a new session.
                </p>
              </div>
              <CreateUpdateSessionDialog
                useButton
                buttonChildren={
                  <>
                    <PlusIcon />
                    New Session
                  </>
                }
              />
            </div>
            <Suspense fallback={<OracleSessionsListLoading />}>
              <OracleSessionsListSuspense {...props} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

const OracleSessionsListLoading = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full rounded-md" />

        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <OracleSessionCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

const OracleSessionCardSkeleton = () => {
  return (
    <Card className="w-full h-full">
      <CardContent className="flex flex-col gap-4 w-full h-full">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-3/4" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        <div className="flex-1 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="size-5 shrink-0" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>

        <Skeleton className="h-9 w-full mt-auto" />
      </CardContent>
    </Card>
  );
};

const OracleSessionsListSuspense = async ({
  searchParams,
}: OracleSessionsListParams) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const filters = await loadOracleSessionSearchParams(searchParams);

  const { userSessions, metadata } = await getUserSessionsAction(userId, {
    ...filters,
    page: DEFAULT_PAGE,
  });

  return (
    <div className="flex flex-col gap-6">
      <OracleSessionFilters />
      <OracleSessionInfiniteCardGrid
        initialOracleSessions={userSessions}
        initialHasNextPage={metadata.hasNextPage}
        userId={userId}
      />
    </div>
  );
};

export default OracleSessionsListPage;
