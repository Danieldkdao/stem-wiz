import { ChatsSection } from "@/components/dashboard/sections/chats-section";
import { CommunityProblemsSection } from "@/components/dashboard/sections/community-problems-section";
import { InfoCardGridSection } from "@/components/dashboard/sections/info-card-grid-section";
import { MatchListSection } from "@/components/dashboard/sections/match-list-section";
import { MatchRequestsSection } from "@/components/dashboard/sections/match-requests-section";
import { NotificationsSection } from "@/components/dashboard/sections/notifications-section";
import { ObserverInvitationsSection } from "@/components/dashboard/sections/observer-invitations-section";
import { OracleSessionsListSection } from "@/components/dashboard/sections/oracle-sessions-list-section";
import { ProfileActionItemsSection } from "@/components/dashboard/sections/profile-action-items-section";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUpdateSessionDialog } from "@/features/oracle/components/create-update-session-dialog";
import {
  BoxesIcon,
  ChevronRightIcon,
  EyeIcon,
  LandmarkIcon,
  MessageSquareTextIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  SwordsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

const DashboardPage = () => {
  return (
    <div className="h-full w-full overflow-y-auto px-6 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="max-w-3xl text-lg font-medium text-muted-foreground">
              Track your matches, Oracle sessions, community activity, chats,
              and invitations in one place.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <LinkButton href="/arena/waiting">
              <SwordsIcon />
              Find Match
            </LinkButton>
            <CreateUpdateSessionDialog
              useButton
              variant="outline"
              buttonChildren={
                <>
                  <PlusIcon />
                  New Oracle Session
                </>
              }
            />
          </div>
        </div>

        <InfoCardGridSection />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <MatchListSection />

            <OracleSessionsListSection />

            <MatchRequestsSection />

            <ObserverInvitationsSection />

            <CommunityProblemsSection />
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <QuickActions />

            <NotificationsSection />

            <ChatsSection />

            <ProfileActionItemsSection />
          </aside>
        </div>
      </div>
    </div>
  );
};

const QuickActions = () => {
  const actions = [
    {
      title: "Find a match",
      href: "/arena/waiting",
      icon: SwordsIcon,
    },
    {
      title: "Challenge a friend",
      href: "/arena",
      icon: LandmarkIcon,
    },
    {
      title: "Observe live matches",
      href: "/arena/observe",
      icon: EyeIcon,
    },
    {
      title: "Explore developers",
      href: "/community",
      icon: UsersIcon,
    },
    {
      title: "Start a chat",
      href: "/community/chats",
      icon: MessageSquareTextIcon,
    },
    {
      title: "Create community problem",
      href: "/community/problems",
      icon: BoxesIcon,
    },
    {
      title: "Oracle practice",
      href: "/oracle/sessions",
      icon: SparklesIcon,
    },
  ];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
          <SearchIcon className="text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 border-b p-4 transition-colors last:border-b-0 hover:bg-muted/60"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <span className="min-w-0 flex-1 font-semibold">
                {action.title}
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DashboardPage;
