import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendMatchRequestForm } from "@/features/matches/components/friend-match-request-form";
import {
  ChevronRightIcon,
  EyeIcon,
  HistoryIcon,
  MailIcon,
  SwordsIcon,
} from "lucide-react";
import Link from "next/link";
import { FaQuestion } from "react-icons/fa6";

// const options = [
//   {
//     title: "Compete",
//     description:
//       "Enter matchmaking and face another developer in a timed coding challenge.",
//     icon: SwordsIcon,
//     href: "/arena/waiting",
//     features: ["1v1 live match", "Timed problem", "Submit code to finish"],
//     buttonText: "Find a match",
//     buttonVariant: "default" as const,
//     iconBgColor: "bg-accent",
//     checkIconColor: "text-accent",
//   },
//   {
//     title: "Observe",
//     description:
//       "Browse active battles, watch code evolve, and learn from other developers.",
//     icon: EyeIcon,
//     href: "/arena/observe",
//     features: ["Live match list", "Observer view", "Learn from submissions"],
//     buttonText: "Watch matches",
//     buttonVariant: "outline" as const,
//     iconBgColor: "bg-muted",
//     checkIconColor: "text-muted-foreground",
//   },
// ];

const tabs = [
  {
    value: "random-pairing" as const,
    children: () => (
      <div className="flex flex-col gap-2">
        <p className="text-lg font-medium text-muted-foreground">
          We’ll pair you with a developer who matches your XP level and primary
          programming language from your profile.
        </p>
        <div className="bg-muted rounded-md p-5 flex items-center gap-6 justify-center">
          <div className="flex flex-col items-center gap-2">
            <CurrentUserAvatar className="size-20" textClassName="text-lg" />
            <span className="text-xl font-medium text-center">You</span>
          </div>

          <SwordsIcon className="text-primary size-14" />
          <div className="flex flex-col items-center gap-2">
            <div className="size-20 bg-muted-foreground rounded-full flex items-center justify-center border-2 border-dashed border-border">
              <FaQuestion strokeWidth={5} className="size-10" />
            </div>
            <span className="text-xl font-medium text-center">Opponent</span>
          </div>
        </div>
        <LinkButton href="/arena/waiting">Find a match</LinkButton>
      </div>
    ),
  },
  {
    value: "friend-challenge" as const,
    children: () => (
      <div className="flex flex-col gap-2">
        <p className="text-lg font-medium text-muted-foreground">
          Choose a friend to challenge. Once they accept, both of you will enter
          the match room together.
        </p>
        <FriendMatchRequestForm />
      </div>
    ),
  },
];

const ArenaPage = () => {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 items-center py-10 px-6">
      <h1 className="text-4xl font-semibold">Arena</h1>
      <div className="w-full grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        <Card className="border-t-4 border-t-primary">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-2xl font-semibold">Start a match</h2>
              <p className="text-lg text-muted-foreground">
                Choose how you want to find your opponent.
              </p>
            </div>
            <Tabs defaultValue="random-pairing">
              <TabsList variant="line">
                <TabsTrigger value="random-pairing">Random Pairing</TabsTrigger>
                <TabsTrigger value="friend-challenge">
                  Friend Challenge
                </TabsTrigger>
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  {<tab.children />}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="border-t-4 border-t-primary">
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-2xl font-semibold">Observe Live Matches</h2>
                <p className="text-lg text-muted-foreground">
                  Watch active matches, track live code changes, and learn from
                  other submissions.
                </p>
              </div>
              <LinkButton href="/arena/matches">
                <EyeIcon />
                Watch matches
              </LinkButton>
            </CardContent>
          </Card>
          <Link href="/matches">
            <Card className="border-t-4 border-t-primary">
              <CardContent className="flex items-center gap-4">
                <div className="bg-muted rounded-md flex items-center justify-center size-14 shrink-0">
                  <HistoryIcon className="size-10" />
                </div>
                <div className="flex-1 w-full flex items-center gap-2">
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-xl font-semibold">Your matches</span>
                    <span className="text-base text-muted-foreground">
                      View past performance
                    </span>
                  </div>
                  <ChevronRightIcon className="text-muted-foreground size-6 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/match-invitations/requests">
            <Card className="border-t-4 border-t-primary">
              <CardContent className="flex items-center gap-4">
                <div className="bg-muted rounded-md flex items-center justify-center size-14 shrink-0">
                  <MailIcon className="size-10" />
                </div>
                <div className="flex-1 w-full flex items-center gap-2">
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-xl font-semibold">
                      Match Invitations
                    </span>
                    <span className="text-base text-muted-foreground">
                      Your match requests and match observer invitations.
                    </span>
                  </div>
                  <ChevronRightIcon className="text-muted-foreground size-6 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ArenaPage;
