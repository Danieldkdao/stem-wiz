import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUserProfileAction } from "@/features/user/actions/actions";
import { UserProfileForm } from "@/features/user/components/user-profile-form";
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
  return <div>loading...</div>;
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
