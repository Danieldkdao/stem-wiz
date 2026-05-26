import { CodeEditor } from "@/components/code/code-editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getOneSessionAction } from "@/features/oracle/actions/actions";
import { OracleSessionView } from "@/features/oracle/components/oracle-session-view";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ParamsId } from "@/lib/types";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type OracleSessionProps = ParamsId<"sessionId">;

const OracleSessionIdPage = (props: OracleSessionProps) => {
  return (
    <Suspense fallback={<OracleSessionIdLoading />}>
      <OracleSessionIdSuspense {...props} />
    </Suspense>
  );
};

const OracleSessionIdLoading = () => {
  return <div>loading</div>;
};

const OracleSessionIdSuspense = async ({ params }: OracleSessionProps) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;
  const { sessionId } = await params;

  const existingSession = await getOneSessionAction(userId, sessionId);
  if (!existingSession) {
    return <div>session not found</div>;
  }

  if (existingSession.status !== "active")
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
