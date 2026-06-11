import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { getUserSessionsAction } from "@/features/oracle/actions/actions";
import { CreateUpdateSessionDialog } from "@/features/oracle/components/create-update-session-dialog";
import { OracleSessionCard } from "@/features/oracle/components/oracle-session-card";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const OracleSessionsListPage = () => {
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
              <OracleSessionsListSuspense />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

const OracleSessionsListLoading = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="size-8 rounded-md" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const OracleSessionsListSuspense = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return <div>unauthenticated state maybe just null</div>;
  }

  const oracleSessions = await getUserSessionsAction(userId);

  return oracleSessions.length ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {oracleSessions.map((session) => (
        <OracleSessionCard key={session.id} session={session} />
      ))}
    </div>
  ) : (
    <Card className="ring-0 border-4 border-dashed bg-card/75">
      <CardContent className="flex flex-col items-center gap-2 py-4 w-full">
        <h1 className="text-3xl font-semibold text-center">
          No sessions created yet
        </h1>
        <p className="text-muted-foreground text-center max-w-150">
          You haven&apos;t created any sessions yet. Click on the button below
          to get started.
        </p>
        <CreateUpdateSessionDialog
          useButton
          className="mx-auto w-full max-w-100 mt-4"
          buttonChildren={
            <>
              <PlusIcon />
              Create your first session
            </>
          }
        />
      </CardContent>
    </Card>
  );
};

export default OracleSessionsListPage;
