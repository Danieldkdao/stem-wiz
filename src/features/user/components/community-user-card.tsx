import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { UserProfileTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  formatProgrammingLanguage,
  formatUserExperienceLevel,
} from "../lib/formatters";
import { CommunityUserBadges } from "./community-user-badges";

export const CommunityUserCard = ({
  user,
}: {
  user: User & {
    profile: typeof UserProfileTable.$inferSelect;
  };
}) => {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-4">
        <div className="min-w-0 w-full flex items-start gap-4">
          <div className="flex flex-col min-w-0 w-full items-center md:flex-row md:items-start gap-4">
            <Link href={`/community/user/${user.id}`}>
              <UserAvatar
                {...user}
                className="size-20"
                textClassName="text-3xl font-medium"
              />
            </Link>
            <div className="flex flex-col gap-2 items-center md:items-start flex-1 min-w-0">
              <div className="flex items-center md:items-start flex-col gap-0.5 md:w-full">
                <Link href={`/community/user/${user.id}`}>
                  <h2 className="text-3xl font-semibold truncate flex-1 min-w-0 w-full">
                    {user.name}
                  </h2>
                </Link>

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
        </div>
      </CardContent>
    </Card>
  );
};
