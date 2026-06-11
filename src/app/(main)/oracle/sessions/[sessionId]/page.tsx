import { getOneSessionAction } from "@/features/oracle/actions/actions";
import { OracleSessionNotFound } from "@/features/oracle/components/oracle-session-not-found";
import { OracleSessionView } from "@/features/oracle/components/oracle-session-view";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ParamsId } from "@/lib/types";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type OracleSessionProps = ParamsId<"sessionId">;

const OracleSessionIdPage = (props: OracleSessionProps) => {
  return (
    <Suspense fallback={<OracleSessionIdLoading />}>
      <OracleSessionIdSuspense {...props} />
    </Suspense>
  );
};

const OracleSessionIdLoading = () => {
  return (
    <div className="w-full h-full bg-card/75">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex w-full items-center justify-between gap-4 border-b bg-background/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-8 w-48 max-w-[40vw]" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="size-9 rounded-md" />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,0.85fr)_1px_minmax(360px,1fr)_1px_minmax(280px,0.85fr)]">
          <div className="min-h-0 overflow-hidden p-6">
            <div className="flex h-full flex-col gap-4">
              <Skeleton className="h-9 w-3/4" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="h-px w-full bg-border" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
          <div className="bg-border" />
          <div className="grid min-h-0 grid-rows-2">
            <OracleWorkAreaSkeleton />
            <OracleWorkAreaSkeleton output />
          </div>
          <div className="bg-border" />
          <div className="min-h-0 overflow-hidden p-6">
            <div className="flex h-full flex-col gap-4">
              <Skeleton className="h-8 w-40" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-10/12" />
                <Skeleton className="h-5 w-8/12" />
              </div>
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OracleWorkAreaSkeleton = ({ output }: { output?: boolean }) => {
  return (
    <div className="min-h-0 border-b bg-background last:border-b-0">
      <div className="flex h-11 items-center justify-between border-b px-4">
        <Skeleton className="h-5 w-28" />
        {output && <Skeleton className="h-8 w-24" />}
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-8/12" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    </div>
  );
};

const OracleSessionIdSuspense = async ({ params }: OracleSessionProps) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;
  const { sessionId } = await params;

  const existingSession = await getOneSessionAction(userId, sessionId);
  if (!existingSession) {
    return <OracleSessionNotFound />;
  }

  if (existingSession.status === "upcoming")
    return redirect(`/oracle/sessions/${sessionId}/waiting`);

  return (
    <div className="w-full h-full bg-card/75">
      <OracleSessionView
        session={existingSession}
        problems={existingSession.problems}
      />
    </div>
  );
};

export default OracleSessionIdPage;
