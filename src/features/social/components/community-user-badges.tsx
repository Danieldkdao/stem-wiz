"use client";

import { Badge } from "@/components/ui/badge";
import { UserProfileTable } from "@/db/schema";
import { HourglassIcon, LinkIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

export const CommunityUserBadges = ({
  profile,
}: {
  profile: typeof UserProfileTable.$inferSelect;
}) => {
  return (
    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
      {profile.location && (
        <Badge>
          <MapPinIcon />
          <span>{profile.location}</span>
        </Badge>
      )}
      {profile.yearsProgramming && (
        <Badge>
          <HourglassIcon />
          <span>{profile.yearsProgramming} years experience</span>
        </Badge>
      )}
      {profile.portfolioUrl && (
        <Link href={profile.portfolioUrl}>
          <Badge variant="outline">
            <LinkIcon />
            <span>Portfolio</span>
          </Badge>
        </Link>
      )}

      {profile.githubUrl && (
        <Link href={profile.githubUrl}>
          <Badge variant="outline">
            <FaGithub />
            <span>GitHub</span>
          </Badge>
        </Link>
      )}
      {profile.linkedinUrl && (
        <Link href={profile.linkedinUrl}>
          <Badge variant="outline">
            <FaLinkedin />
            <span>LinkedIn</span>
          </Badge>
        </Link>
      )}
    </div>
  );
};
