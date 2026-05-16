"use client";

import { CodeEditor } from "@/components/code/code-editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import {
  ArenaProblemTable,
  MatchSubmissionTable,
  MatchTable,
  UserMatchTable,
} from "@/db/schema";
import { statusMap } from "@/features/arena/components";
import { User } from "@/lib/auth/auth";
import { cn } from "@/lib/utils";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useMatchObserverSocket } from "../hooks/use-match-observer-socket";
import { MatchParticipantStatuses } from "./match-participant-statuses";
import { ObserverCodeOutput } from "./observer-code-output";

type ObserverMatch = typeof MatchTable.$inferSelect & {
  arenaProblem: typeof ArenaProblemTable.$inferSelect;
  submissions: (typeof MatchSubmissionTable.$inferSelect)[];
  users: (typeof UserMatchTable.$inferSelect & { user: User })[];
};

type ObservedUser = {
  user: User;
  code: string;
  output?: string | null;
  error?: string | null;
  isConnected: boolean;
  isRunningCode: boolean;
  hasSubmittedCode: boolean;
};

const getInitialUsers = (match: ObserverMatch): ObservedUser[] => {
  return match.users.map(({ user }) => {
    const existingSubmission = match.submissions.find(
      (submission) => submission.userId === user.id,
    );

    return {
      user,
      code: existingSubmission?.code ?? "",
      output: null,
      isConnected: true,
      isRunningCode: false,
      hasSubmittedCode: !!existingSubmission,
    };
  });
};

const ObserverUserPanel = ({
  observedUser,
  defaultSize,
  isMirrored,
  programmingLanguage,
}: {
  observedUser: ObservedUser;
  defaultSize: number;
  isMirrored: boolean;
  programmingLanguage: ObserverMatch["arenaProblem"]["programmingLanguage"];
}) => {
  const status = (
    <MatchParticipantStatuses
      isMirrored={isMirrored}
      hasSubmittedCode={observedUser.hasSubmittedCode}
    />
  );
  const avatar = <UserAvatar {...observedUser.user} className="size-10" />;
  const name = (
    <div
      className={cn(
        "flex items-center gap-2 flex-1 min-w-0",
        isMirrored && "flex-row-reverse",
      )}
    >
      <span
        className={`text-xl font-semibold truncate ${
          isMirrored ? "text-right" : ""
        }`}
      >
        {observedUser.user.name}
      </span>
      <Tooltip>
        <TooltipTrigger>
          {statusMap[observedUser.isConnected ? "open" : "closed"].element}
        </TooltipTrigger>
        <TooltipContent>
          {observedUser.isConnected
            ? "This user is connected."
            : "This user is disconnected."}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <ResizablePanel
      minSize={30}
      defaultSize={defaultSize}
      className="bg-card/75 flex flex-col"
    >
      <div className="p-4 border-b flex items-center gap-4 w-full min-w-0">
        {isMirrored ? (
          <>
            {status}
            {name}
            {avatar}
          </>
        ) : (
          <>
            {avatar}
            {name}
            {status}
          </>
        )}
      </div>
      <ResizablePanelGroup orientation="vertical" className="flex-1">
        <ResizablePanel minSize={30}>
          <div className="w-full h-full">
            <CodeEditor
              language={programmingLanguage}
              value={observedUser.code}
              options={{ readOnly: true }}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize={30}>
          <div className="w-full h-full">
            <ObserverCodeOutput
              output={observedUser.output}
              error={observedUser.error}
              isRunning={observedUser.isRunningCode}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ResizablePanel>
  );
};

export const ObserverMatchView = ({ match }: { match: ObserverMatch }) => {
  const { status, lastEvent } = useMatchObserverSocket();

  const [users, setUsers] = useState<ObservedUser[]>(() =>
    getInitialUsers(match),
  );

  const updateUsers = useCallback(
    (propsToUpdate: Partial<ObservedUser>, userId?: string) => {
      setUsers((prev) =>
        prev.map((user) => {
          if (userId && userId !== user.user.id) return user;

          return {
            ...user,
            ...propsToUpdate,
          };
        }),
      );
    },
    [],
  );

  useEffect(() => {
    setUsers((prev) => {
      const existingUsersById = new Map(
        prev.map((observedUser) => [observedUser.user.id, observedUser]),
      );

      return match.users.map(({ user }) => {
        const existingUser = existingUsersById.get(user.id);
        const existingSubmission = match.submissions.find(
          (submission) => submission.userId === user.id,
        );

        if (existingUser) {
          return {
            ...existingUser,
            user,
            hasSubmittedCode: !!existingSubmission,
          };
        }

        return {
          user,
          code: existingSubmission?.code ?? "",
          output: null,
          isConnected: true,
          isRunningCode: false,
          hasSubmittedCode: !!existingSubmission,
        };
      });
    });
  }, [match.users, match.submissions]);

  useEffect(() => {
    if (status !== "open") return;

    const lastEventType = lastEvent?.type;
    switch (lastEventType) {
      case "observer_code_snapshot":
        updateUsers({ code: lastEvent.code }, lastEvent.userId);
        break;
      case "observer_code_output":
        updateUsers(
          {
            output: lastEvent.output,
            error: lastEvent.error,
            isRunningCode: false,
          },
          lastEvent.userId,
        );
        break;
      case "observer_running_code":
        updateUsers({ isRunningCode: true }, lastEvent.userId);
        break;
      case "user_submitted_code":
        updateUsers({ hasSubmittedCode: true }, lastEvent.userId);
        break;
      case "users_connection_statuses":
        lastEvent.users.forEach((user) => {
          updateUsers({ isConnected: user.isConnected }, user.userId);
        });
        break;
      default:
        return;
    }
  }, [status, lastEvent, updateUsers]);

  const defaultPanelSize = users.length > 0 ? 100 / users.length : 100;

  return (
    <ResizablePanelGroup orientation="horizontal">
      {users.map((user, index) => (
        <Fragment key={user.user.id}>
          {index > 0 && <ResizableHandle />}
          <ObserverUserPanel
            observedUser={user}
            defaultSize={defaultPanelSize}
            isMirrored={index % 2 === 1}
            programmingLanguage={match.arenaProblem.programmingLanguage}
          />
        </Fragment>
      ))}
    </ResizablePanelGroup>
  );
};
