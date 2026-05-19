import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { UserProfileTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import {
  formatProgrammingLanguage,
  formatUserExperienceLevel,
} from "../lib/formatters";
import {
  HourglassIcon,
  LinkIcon,
  MapPinIcon,
  UserPlusIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/tooltip-wrapper";

export const CommunityUserCard = ({
  user,
}: {
  user: User & { profile: typeof UserProfileTable.$inferSelect };
}) => {
  return (
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
                <TooltipWrapper content="Add user to friends">
                  <Button variant="outline" size="icon">
                    <UserPlusIcon />
                  </Button>
                </TooltipWrapper>
              </div>

              <p className="text-base text-center md:text-start text-muted-foreground">
                {user.profile.experienceLevel &&
                  formatUserExperienceLevel(user.profile.experienceLevel)}{" "}
                Developer
                {` • ${formatProgrammingLanguage(user.profile.preferredLanguage)}`}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
              {user.profile.location && (
                <Badge>
                  <MapPinIcon />
                  <span>{user.profile.location}</span>
                </Badge>
              )}
              {user.profile.yearsProgramming && (
                <Badge>
                  <HourglassIcon />
                  <span>{user.profile.yearsProgramming} years experience</span>
                </Badge>
              )}
              {user.profile.portfolioUrl && (
                <Badge asChild variant="outline">
                  <Link href={user.profile.portfolioUrl}>
                    <LinkIcon />
                    <span>Portfolio</span>
                  </Link>
                </Badge>
              )}
              {user.profile.githubUrl && (
                <Badge asChild variant="outline">
                  <Link href={user.profile.githubUrl}>
                    <FaGithub />
                    <span>GitHub</span>
                  </Link>
                </Badge>
              )}
              {user.profile.linkedinUrl && (
                <Badge asChild variant="outline">
                  <Link href={user.profile.linkedinUrl}>
                    <FaLinkedin />
                    <span>LinkedIn</span>
                  </Link>
                </Badge>
              )}
            </div>

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
  );
};
