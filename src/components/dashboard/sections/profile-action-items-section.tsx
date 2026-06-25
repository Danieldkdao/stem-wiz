import { ErrorState } from "@/components/error-state";
import { getUserProfileAction } from "@/features/social/actions/actions";
import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";
import { DashboardSection } from "../dashboard-section";
import { UserRoundCogIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/link-button";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileActionItemsSection = () => {
  return (
    <Suspense fallback={<ProfileActionItemsSectionLoading />}>
      <ProfileActionItemsSectionSuspense />
    </Suspense>
  );
};

const ProfileActionItemsSectionLoading = () => {
  return (
    <DashboardSection
      icon={UserRoundCogIcon}
      title="Profile"
      href="/my-profile"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    </DashboardSection>
  );
};

const ProfileActionItemsSectionSuspense = async () => {
  const { userId } = await getCurrentUser();
  if (!userId)
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to fetch the data. Try refreshing the page."
      />
    );

  const getMissingProfileItems = (
    profile: Awaited<ReturnType<typeof getUserProfileAction>>,
  ) => {
    if (!profile) return ["Profile details"];

    return [
      !profile.bio ? "Bio" : null,
      !profile.goals?.length ? "Goals" : null,
      !profile.availability ? "Availability" : null,
      !profile.githubUrl ? "GitHub" : null,
      !profile.portfolioUrl ? "Portfolio" : null,
      !profile.linkedinUrl ? "LinkedIn" : null,
      !profile.timezone ? "Timezone" : null,
      !profile.location ? "Location" : null,
    ].filter((item): item is string => Boolean(item));
  };

  const profile = await getUserProfileAction(userId);

  const missingProfileItems = getMissingProfileItems(profile);

  return (
    missingProfileItems.length > 0 && (
      <DashboardSection
        icon={UserRoundCogIcon}
        title="Profile"
        href="/my-profile"
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Complete your profile so matches and community discovery are more
            relevant.
          </p>
          <div className="flex flex-wrap gap-2">
            {missingProfileItems.slice(0, 5).map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
          <LinkButton href="/my-profile" size="sm" variant="outline">
            Update profile
          </LinkButton>
        </div>
      </DashboardSection>
    )
  );
};
