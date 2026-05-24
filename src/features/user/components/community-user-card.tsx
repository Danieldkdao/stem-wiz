import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { FriendRequestTable, UserProfileTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { cn } from "@/lib/utils";
import {
  formatProgrammingLanguage,
  formatUserExperienceLevel,
} from "../lib/formatters";
import { CommunityUserBadges } from "./community-user-badges";
import Link from "next/link";
import { FriendRequestButton } from "@/features/friend-requests/components/friend-request-button";

export const CommunityUserCard = ({
  user,
}: {
  user: User & {
    profile: typeof UserProfileTable.$inferSelect;
    existingFriendRequest: typeof FriendRequestTable.$inferSelect;
  };
}) => {
  return (
    <Link href={`/community/user/${user.id}`} className="w-full h-full">
      <Card className="h-full">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
            <UserAvatar
              {...user}
              className="size-20"
              textClassName="text-3xl font-medium"
            />
            <div className="flex flex-col gap-2 items-center md:items-start flex-1 min-w-0">
              <div className="flex items-center md:items-start flex-col gap-0.5 md:w-full">
                <div className="flex items-center gap-2 w-full min-w-0">
                  <h2 className="text-3xl font-semibold truncate flex-1 min-w-0 w-full">
                    {user.name}
                  </h2>
                  <FriendRequestButton
                    userId={user.id}
                    existingFriendRequest={user.existingFriendRequest}
                  />
                </div>

                <p className="text-base text-center md:text-start text-muted-foreground">
                  {user.profile.experienceLevel &&
                    formatUserExperienceLevel(
                      user.profile.experienceLevel,
                    )}{" "}
                  Developer
                  {` • ${formatProgrammingLanguage(user.profile.preferredLanguage)}`}
                </p>
              </div>

              <CommunityUserBadges profile={user.profile} />

              <p
                className={cn(
                  "line-clamp-2 text-muted-foreground text-center md:text-start",
                  !user.profile.bio && "italic",
                )}
              >
                {user.profile.bio ?? "This user has not added a bio yet."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
