import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { ArenaMatchOptionsTabs } from "@/features/arena/components/arena-match-options-tabs";
import { ChevronRightIcon, EyeIcon, HistoryIcon, MailIcon } from "lucide-react";
import Link from "next/link";

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
            <ArenaMatchOptionsTabs />
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
              <LinkButton href="/arena/observe">
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
