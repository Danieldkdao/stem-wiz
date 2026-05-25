import { Header } from "@/components/dashboard/header";
import { NewSessionDialog } from "@/features/oracle/components/new-session-dialog";
import { PlusIcon } from "lucide-react";

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
              <NewSessionDialog
                useButton
                buttonChildren={
                  <>
                    <PlusIcon />
                    New Session
                  </>
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OracleSessionsListPage;
