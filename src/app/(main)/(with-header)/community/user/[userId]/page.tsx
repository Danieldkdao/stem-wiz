import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { FriendRequestStatusButtons } from "@/features/friends/components/friend-request-status-buttons";
import { getUserAction } from "@/features/social/actions/actions";
import {
  formatProgrammingLanguage,
  formatUserAvailabilityDays,
  formatUserAvailabilityTimeOfDay,
  formatUserCollborationStyle,
  formatUserExperienceLevel,
  formatUserGoals,
  formatUserLookingFor,
  formatUserMeetupPreference,
} from "@/features/social/lib/formatters";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ParamsId } from "@/lib/types";
import {
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  CodeIcon,
  DumbbellIcon,
  EarthIcon,
  ExternalLinkIcon,
  GlobeIcon,
  HandshakeIcon,
  MailIcon,
  MapPinIcon,
  MedalIcon,
  RefreshCcwIcon,
  SearchIcon,
  SunIcon,
  UserPlusIcon,
  UserRoundIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

type CommunityUserIdParams = ParamsId<"userId">;

const CommunityUserIdPage = (props: CommunityUserIdParams) => {
  return (
    <Suspense fallback={<CommunityUserIdLoading />}>
      <CommunityUserIdSuspense {...props} />
    </Suspense>
  );
};

const CommunityUserIdLoading = () => {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-300 flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
            <Skeleton className="size-28 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <Skeleton className="h-10 w-64 max-w-full" />
              <Skeleton className="h-5 w-80 max-w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const CommunityUserIdSuspense = async ({ params }: CommunityUserIdParams) => {
  const { userId } = await params;
  const { userId: currentUserId } = await getCurrentUser();
  const user = await getUserAction(userId, currentUserId);

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <SearchIcon className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">User not found</h1>
              <p className="text-muted-foreground">
                This developer profile may have been moved or removed.
              </p>
            </div>
            <Button asChild>
              <Link href="/community">Back to Community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile } = user;
  const hasAvailability =
    !!profile?.availability?.days?.length ||
    !!profile?.availability?.timeOfDay?.length ||
    typeof profile?.availability?.hoursPerWeek === "number";
  const goals = profile?.goals ?? [];

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="mx-auto flex w-full flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <UserAvatar
              {...user}
              className="size-28 shrink-0"
              textClassName="text-4xl font-semibold"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-4xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">
                  {profile ? (
                    <>
                      {profile.experienceLevel
                        ? formatUserExperienceLevel(profile.experienceLevel)
                        : "Developer"}{" "}
                      Developer •{" "}
                      {formatProgrammingLanguage(profile.preferredLanguage)}
                    </>
                  ) : (
                    "Community Developer"
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile?.location && (
                  <Badge variant="secondary">
                    <MapPinIcon />
                    {profile.location}
                  </Badge>
                )}
                {profile?.timezone && (
                  <Badge variant="secondary">
                    <GlobeIcon />
                    {profile.timezone}
                  </Badge>
                )}
                {profile?.lookingFor && (
                  <Badge>
                    <UsersIcon />
                    {formatUserLookingFor(profile.lookingFor)}
                  </Badge>
                )}
                {!profile && (
                  <Badge variant="outline">Profile not completed yet</Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button variant="outline" asChild>
                <Link href={`mailto:${user.email}`}>
                  <MailIcon />
                  Email
                </Link>
              </Button>
              <ProfileLink
                href={profile?.githubUrl}
                label="GitHub"
                icon="github"
              />
              <ProfileLink
                href={profile?.portfolioUrl}
                label="Portfolio"
                icon="external"
              />
              <ProfileLink
                href={profile?.linkedinUrl}
                label="LinkedIn"
                icon="linkedin"
              />
              <FriendRequestStatusButtons
                userId={user.id}
                existingFriendRequest={user.existingFriendRequest}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>
                  What this developer has shared.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">
                  {profile?.bio ?? "This user has not added a bio yet."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collaboration</CardTitle>
                <CardDescription>
                  How they want to meet, build, and work with others.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={<UsersIcon />}
                  label="Looking For"
                  value={
                    profile?.lookingFor
                      ? formatUserLookingFor(profile.lookingFor)
                      : null
                  }
                />
                <InfoTile
                  icon={<HandshakeIcon />}
                  label="Collaboration Style"
                  value={
                    profile?.collaborationStyle
                      ? formatUserCollborationStyle(profile.collaborationStyle)
                      : null
                  }
                />
                <InfoTile
                  icon={<UserRoundIcon />}
                  label="Meetup Preference"
                  value={
                    profile?.meetupPreference
                      ? formatUserMeetupPreference(profile.meetupPreference)
                      : null
                  }
                />
                <InfoTile
                  icon={<ClockIcon />}
                  label="Years Programming"
                  value={
                    profile?.yearsProgramming !== null &&
                    profile?.yearsProgramming !== undefined
                      ? `${profile.yearsProgramming} ${
                          profile.yearsProgramming === 1 ? "year" : "years"
                        }`
                      : null
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
                <CardDescription>
                  What they are hoping to do here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {goals.length ? (
                  <div className="flex flex-wrap gap-2">
                    {goals.map((goal) => (
                      <Badge key={goal} variant="secondary">
                        <DumbbellIcon />
                        {formatUserGoals(goal)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <EmptyValue>This user has not added goals yet.</EmptyValue>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Developer Details</CardTitle>
                <CardDescription>
                  Profile basics and public info.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Preferred Language"
                  value={
                    profile?.preferredLanguage
                      ? formatProgrammingLanguage(profile.preferredLanguage)
                      : null
                  }
                  icon={<CodeIcon />}
                />
                <InfoRow
                  label="Experience Level"
                  value={
                    profile?.experienceLevel
                      ? formatUserExperienceLevel(profile.experienceLevel)
                      : null
                  }
                  icon={<MedalIcon />}
                />
                <InfoRow
                  label="Location"
                  value={profile?.location}
                  icon={<EarthIcon />}
                />
                <InfoRow
                  label="Timezone"
                  value={profile?.timezone}
                  icon={<MapPinIcon />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>
                  When they are open to connecting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasAvailability ? (
                  <>
                    <InfoRow
                      label="Days"
                      value={profile?.availability?.days
                        ?.map(formatUserAvailabilityDays)
                        .join(", ")}
                      icon={<CalendarIcon />}
                    />
                    <InfoRow
                      label="Time of Day"
                      value={profile?.availability?.timeOfDay
                        ?.map(formatUserAvailabilityTimeOfDay)
                        .join(", ")}
                      icon={<SunIcon />}
                    />
                    <InfoRow
                      label="Hours per Week"
                      value={
                        typeof profile?.availability?.hoursPerWeek === "number"
                          ? `${profile.availability.hoursPerWeek} hours`
                          : null
                      }
                      icon={<ClockIcon />}
                    />
                  </>
                ) : (
                  <EmptyValue>
                    This user has not shared their availability yet.
                  </EmptyValue>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Basic account information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Email" value={user.email} icon={<MailIcon />} />
                <InfoRow
                  label="Email Verified"
                  value={
                    <span className="inline-flex items-center gap-1">
                      {user.emailVerified ? (
                        <>
                          <CheckCircle2Icon className="size-4 text-primary" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="size-4 text-muted-foreground" />
                          Not verified
                        </>
                      )}
                    </span>
                  }
                  icon={<CheckIcon />}
                />
                <InfoRow
                  label="Joined"
                  value={formatProfileDate(user.createdAt)}
                  icon={<UserPlusIcon />}
                />
                <InfoRow
                  label="Updated"
                  value={formatProfileDate(user.updatedAt)}
                  icon={<RefreshCcwIcon />}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileLink = ({
  href,
  label,
  icon,
}: {
  href?: string | null;
  label: string;
  icon: "external" | "github" | "linkedin";
}) => {
  if (!href) return null;

  return (
    <Button variant="outline" asChild>
      <a href={href} target="_blank" rel="noreferrer">
        {icon === "github" && <FaGithub />}
        {icon === "linkedin" && <FaLinkedin />}
        {icon === "external" && <ExternalLinkIcon />}
        {label}
      </a>
    </Button>
  );
};

const InfoTile = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) => {
  return (
    <div className="rounded-lg border bg-background/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <span className="[&>svg]:size-4">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-base font-semibold">
        {value || <EmptyValue>Not shared yet</EmptyValue>}
      </div>
    </div>
  );
};

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: ReactNode;
  icon: ReactNode;
}) => {
  return (
    <div className="border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="[&>svg]:size-4 text-muted-foreground">{icon}</span>
          <span className="text-muted-foreground">{label}</span>
        </div>

        <span className="text-right font-medium">
          {value || <EmptyValue>Not shared yet</EmptyValue>}
        </span>
      </div>
    </div>
  );
};

const EmptyValue = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="font-normal italic text-muted-foreground">{children}</span>
  );
};

const formatProfileDate = (date: Date) => {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default CommunityUserIdPage;
