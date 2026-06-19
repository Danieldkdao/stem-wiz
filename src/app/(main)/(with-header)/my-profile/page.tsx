import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserProfileAction } from "@/features/social/actions/actions";
import { UserProfileForm } from "@/features/social/components/user-profile-form";
import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";

const UserAccountPage = () => {
  return (
    <Suspense fallback={<UserAccountLoading />}>
      <UserAccountSuspense />
    </Suspense>
  );
};

const UserAccountLoading = () => {
  return (
    <div className="w-full h-full py-10 px-6 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-200">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-full max-w-150" />
              <Skeleton className="h-4 w-4/5 max-w-130" />
            </div>
            <Separator />
            <div className="flex flex-col gap-4 w-full">
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileFieldSkeleton />
                <ProfileFieldSkeleton />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileFieldSkeleton />
                <ProfileFieldSkeleton />
              </div>
              <ProfileFieldSkeleton inputClassName="h-28" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ProfileFieldSkeleton />
                <ProfileFieldSkeleton />
                <ProfileFieldSkeleton />
              </div>
              <Skeleton className="h-10 w-full sm:w-40 self-end" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProfileFieldSkeleton = ({
  inputClassName = "h-9",
}: {
  inputClassName?: string;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 shrink-0" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className={`w-full ${inputClassName}`} />
    </div>
  );
};

const UserAccountSuspense = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;
  const userProfile = await getUserProfileAction(userId);
  if (!userProfile) return null;

  return (
    <div className="w-full h-full py-10 px-6 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-200">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Profile Details</h2>
              <p className="text-sm font-medium text-muted-foreground">
                Update your profile details to find others with similar
                interests and schedules.
              </p>
            </div>
            <Separator />
            <UserProfileForm userProfile={userProfile} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAccountPage;
