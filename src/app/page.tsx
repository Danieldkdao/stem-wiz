import { LightDarkImage } from "@/components/light-dark-image";
import { LinkButton } from "@/components/link-button";
import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/helpers";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  BellIcon,
  LayoutDashboardIcon,
  RadioIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UserPlusIcon,
} from "lucide-react";
import { Suspense } from "react";

const features = [
  {
    icon: ShieldCheckIcon,
    feature: "Secure by default",
    text: "Account authentication, verified emails, and permission checks help keep private matches, chats, and shared problems protected.",
  },
  {
    icon: BellIcon,
    feature: "Realtime notifications",
    text: "Get updates when requests, invitations, chats, and shared problems need your attention.",
  },
  {
    icon: RadioIcon,
    feature: "Live presence",
    text: "Realtime sockets keep match rooms, observers, chats, and notifications feeling current without constant refreshes.",
  },
  {
    icon: SlidersHorizontalIcon,
    feature: "Smart filtering",
    text: "Filter developers, matches, sessions, chats, and problems by the details that matter most.",
  },
  {
    icon: UserPlusIcon,
    feature: "Invitation workflows",
    text: "Send, accept, reject, or revoke friend requests, match challenges, observer invites, and shared problem access.",
  },
  {
    icon: LayoutDashboardIcon,
    feature: "Unified tracking",
    text: "Keep active work, pending actions, recent messages, and profile reminders visible from one dashboard.",
  },
];

const mainFeatures = [
  {
    title: "Compete in live coding matches",
    description:
      "Jump into timed head-to-head challenge, solve real problems in our integrated editor, and review results when the match is done.",
    lightImageSrc: "/arena-match-image-light.png",
    darkImageSrc: "/arena-match-image-dark.png",
    alt: "arena-match-image",
    reverse: false,
  },
  {
    title: "Practice with the Oracle",
    description:
      "Start guided sessions tailored to your language and goals, work through generated problems, and get feedback that helps you improve.",
    lightImageSrc: "/oracle-session-image-light.png",
    darkImageSrc: "/oracle-session-image-dark.png",
    alt: "oracle-session-image",
    reverse: true,
  },
  {
    title: "Learn with a developer community",
    description:
      "Discover other developers, share community problems, start chats, and find people who match how you want to learn or build.",
    lightImageSrc: "/community-image-light.png",
    darkImageSrc: "/community-image-dark.png",
    alt: "community-image",
    reverse: false,
  },
];

const HomePage = () => {
  return (
    <div className="w-full flex flex-col gap-32 overflow-auto">
      <Header />
      <div className="flex py-10 px-6 flex-col gap-32 mx-auto max-w-7xl">
        <div className="w-full flex flex-col gap-8">
          <div className="flex flex-col gap-6 items-center">
            <h1 className="text-4xl md:text-5xl font-bold text-center max-w-200">
              Build your coding skills with practice that feels active.
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-175">
              Join live challenges, work through AI-guided sessions, share
              problems, and connect with developers learning alongside you.
            </p>
            <div className="flex items-center gap-2">
              <Suspense fallback={<Skeleton className="w-52 h-11" />}>
                <GetStartedButton />
              </Suspense>
            </div>
          </div>
          <div className="w-full max-w-7xl mx-auto relative h-80 md:h-100 rounded-lg overflow-hidden">
            <LightDarkImage
              lightImageSrc="/hero-image-light.png"
              darkImageSrc="/hero-image-dark.png"
              fill
              className="object-cover"
              alt="hero-image"
            />
          </div>
        </div>
        <div className="flex flex-col w-full gap-32">
          {mainFeatures.map((feature) => (
            <div
              key={feature.alt}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div
                className={cn(
                  "flex flex-col gap-2 items-center justify-center h-full w-full",
                  feature.reverse && "md:order-2",
                )}
              >
                <h2 className="text-3xl md:text-4xl font-semibold text-center">
                  {feature.title}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground text-center max-w-150">
                  {feature.description}
                </p>
              </div>
              <div
                className={cn(
                  "relative h-80 w-full overflow-hidden rounded-lg border border-border bg-card md:h-100",
                  feature.reverse && "md:order-1",
                )}
              >
                <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                  <div className="size-4 rounded-full bg-destructive" />
                  <div className="size-4 rounded-full bg-yellow-500" />
                  <div className="size-4 rounded-full bg-primary" />
                </div>

                <div className="absolute inset-x-3 bottom-3 top-11">
                  <LightDarkImage
                    lightImageSrc={feature.lightImageSrc}
                    darkImageSrc={feature.darkImageSrc}
                    fill
                    className="object-contain"
                    alt={feature.alt}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 items-center w-full">
          <h2 className="text-3xl font-semibold text-center max-w-200">
            Other features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="flex flex-col gap-2">
                  <div className="size-12 rounded-md bg-primary/30 flex items-center justify-center mt-2">
                    <feature.icon className="size-6" />
                  </div>
                  <span className="text-xl font-medium">{feature.feature}</span>
                  <p className="text-base text-muted-foreground">
                    {feature.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const GetStartedButton = async () => {
  const { userId } = await getCurrentUser();
  const href = userId ? "/dashboard" : "/sign-in";

  return (
    <LinkButton href={href} className="w-72 h-11" asChild>
      {userId ? "Continue to dashboard" : "Get started"}
      <ArrowRightIcon />
    </LinkButton>
  );
};

export default HomePage;
