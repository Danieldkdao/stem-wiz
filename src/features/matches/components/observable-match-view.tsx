"use client";

import {
  ArenaProblemConfigTable,
  ChatMessageTable,
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
  ProblemTable,
  UserMatchTable,
} from "@/db/schema";
import { MatchChatMessagesContextProvider } from "@/features/chats/hooks/use-match-chat-messages";
import { User } from "@/lib/auth/auth";
import { ObservableMatchHeader } from "./observable-match-header";
import { ObserverMatchView } from "./observer-match-view";

export const ObservableMatchView = ({
  match,
  initialMessages,
  initialHasNextPage,
}: {
  match: typeof MatchTable.$inferSelect & {
    submissions: (typeof MatchSubmissionTable.$inferSelect)[];
    users: (typeof UserMatchTable.$inferSelect & { user: User })[];
    result?: typeof MatchResultTable.$inferSelect | null;
    arenaProblem: typeof ArenaProblemConfigTable.$inferSelect & {
      problem: typeof ProblemTable.$inferSelect;
    };
  };
  initialMessages: (typeof ChatMessageTable.$inferSelect & {
    user: User;
  })[];
  initialHasNextPage: boolean;
}) => {
  return (
    <MatchChatMessagesContextProvider
      matchId={match.id}
      initialMessages={initialMessages}
      initialHasNextPage={initialHasNextPage}
    >
      <div className="w-full h-full flex flex-col items-center">
        <ObservableMatchHeader match={match} />
        <ObserverMatchView match={match} />
      </div>
    </MatchChatMessagesContextProvider>
  );
};
