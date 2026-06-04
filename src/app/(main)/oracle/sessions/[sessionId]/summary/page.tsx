import { Skeleton } from "@/components/ui/skeleton";
import { getOneSessionAction } from "@/features/oracle/actions/actions";
import { OracleSessionNotFound } from "@/features/oracle/components/oracle-session-not-found";
import { OracleSessionSummaryView } from "@/features/oracle/components/oracle-session-summary-view";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ParamsId } from "@/lib/types";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type OracleSessionSummaryParams = ParamsId<"sessionId">;

const OracleSessionSummaryPage = (props: OracleSessionSummaryParams) => {
  return (
    <div className="w-full h-full flex flex-col items-center py-10 px-6 overflow-y-auto">
      <div className="w-full max-w-7xl">
        <Suspense fallback={<OracleSessionSummaryLoading />}>
          <OracleSessionSummarySuspense {...props} />
        </Suspense>
      </div>
    </div>
  );
};

const OracleSessionSummaryLoading = () => {
  return (
    <div
      className="flex w-full flex-col items-start gap-4"
      aria-label="Loading session summary"
    >
      <Skeleton className="h-10 w-40" />

      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-14 w-full max-w-3xl sm:h-16" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <Skeleton className="h-6 w-4/5 max-w-xl" />
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border bg-card p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="size-6" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col gap-4 rounded-xl border bg-card p-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5" />
                <Skeleton className="h-6 w-56 max-w-full" />
              </div>
              {index < 4 && <Skeleton className="h-px w-full rounded-none" />}
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col gap-4">
          <Skeleton className="h-10 w-80 max-w-full" />
          <div className="flex w-full flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border bg-card p-6">
                <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <Skeleton className="h-7 w-full max-w-xl" />
                    <div className="flex flex-wrap items-center gap-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="size-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const OracleSessionSummarySuspense = async ({
  params,
}: OracleSessionSummaryParams) => {
  const { sessionId } = await params;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const session = await getOneSessionAction(userId, sessionId);
  if (!session) {
    return <OracleSessionNotFound />;
  }

  if (session.status !== "completed" || !session.completedAt)
    return redirect(`/oracle/sessions/${session.id}`);

  return <OracleSessionSummaryView session={session} />;
};

export default OracleSessionSummaryPage;
