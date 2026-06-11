import { FriendChatSocketProvider } from "@/features/chats/hooks/use-friend-chat-socket";
import { MatchObserverSocketProvider } from "@/features/matches/hooks/use-match-observer-socket";
import { MatchSocketProvider } from "@/features/matches/hooks/use-match-socket";
import { NotificationSocketProvider } from "@/features/notifications/hooks/use-notifications-socket";
import { ReactNode } from "react";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <NotificationSocketProvider>
      <FriendChatSocketProvider>
        <MatchSocketProvider>
          <MatchObserverSocketProvider>
            <div className="bg-radial w-full h-svh from-primary/10 via-primary/20 to-primary/10">
              {children}
              {/* <CommandFooter /> */}
            </div>
          </MatchObserverSocketProvider>
        </MatchSocketProvider>
      </FriendChatSocketProvider>
    </NotificationSocketProvider>
  );
};

export default MainLayout;
