"use client";

import { CodeEditor } from "@/components/code/code-editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { UserAvatar } from "@/components/user-avatar";
import {
  ArenaProblemTable,
  MatchSubmissionTable,
  MatchTable,
  UserMatchTable,
} from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { useMatchObserverSocket } from "../hooks/use-match-observer-socket";
import { useEffect, useState } from "react";
import { ObserverCodeOutput } from "./observer-code-output";

type UsersType = {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
  };
  code: string;
  output?: string | null;
  error?: string | null;
  isRunningCode: boolean;
};

export const ObserverMatchView = ({
  match,
}: {
  match: typeof MatchTable.$inferSelect & {
    arenaProblem: typeof ArenaProblemTable.$inferSelect;
    submissions: (typeof MatchSubmissionTable.$inferSelect)[];
    users: (typeof UserMatchTable.$inferSelect & { user: User })[];
  };
}) => {
  const { status, lastEvent } = useMatchObserverSocket();
  const [users, setUsers] = useState<Record<string, UsersType>>({
    user1: {
      user: match.users[0].user,
      code: "",
      output: null,
      isRunningCode: false,
    },
    user2: {
      user: match.users[1].user,
      code: "",
      output: null,
      isRunningCode: false,
    },
  });

  const updateUsers = (propsToUpdate: Partial<UsersType>, userId?: string) => {
    setUsers((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([key, value]) => [
          key,
          {
            ...value,
            ...(!userId || userId === value.user.id ? propsToUpdate : {}),
          },
        ]),
      ),
    );
  };

  useEffect(() => {
    if (status !== "open") return;

    if (lastEvent?.type === "observer_code_snapshot") {
      updateUsers({ code: lastEvent.code }, lastEvent.userId);
    }
    if (lastEvent?.type === "observer_code_output") {
      updateUsers(
        {
          output: lastEvent.output,
          error: lastEvent.error,
          isRunningCode: false,
        },
        lastEvent.userId,
      );
    }
    if (lastEvent?.type === "observer_running_code") {
      updateUsers({ isRunningCode: true }, lastEvent.userId);
    }
  }, [status, lastEvent]);

  const user1 = users.user1;
  const user2 = users.user2;

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel
        minSize="30%"
        defaultSize="50%"
        className="bg-card/75 flex flex-col"
      >
        <div className="p-4 border-b flex items-center gap-4 w-full min-w-0">
          <UserAvatar {...user1.user} className="size-10" />
          <span className="text-xl font-semibold flex-1 min-w-0 truncate">
            {user1.user.name}
          </span>
        </div>
        <ResizablePanelGroup orientation="vertical" className="flex-1">
          <ResizablePanel minSize="30%">
            <div className="w-full h-full">
              <CodeEditor
                language={match.arenaProblem.programmingLanguage}
                value={user1.code}
                options={{ readOnly: true }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize="30%">
            <div className="w-full h-full">
              <ObserverCodeOutput
                output={user1.output}
                error={user1.error}
                isRunning={user1.isRunningCode}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        minSize="30%"
        defaultSize="50%"
        className="bg-card/75 flex flex-col"
      >
        <div className="p-4 border-b flex justify-end items-center gap-4 w-full min-w-0">
          <span className="text-xl font-semibold flex-1 min-w-0 text-right truncate">
            {user2.user.name}
          </span>
          <UserAvatar {...user2.user} className="size-10" />
        </div>
        <ResizablePanelGroup orientation="vertical" className="flex-1">
          <ResizablePanel minSize="30%">
            <div className="w-full h-full">
              <CodeEditor
                language={match.arenaProblem.programmingLanguage}
                value={user2.code}
                options={{ readOnly: true }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize="30%">
            <div className="w-full h-full">
              <ObserverCodeOutput
                output={user2.output}
                error={user2.error}
                isRunning={user2.isRunningCode}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
