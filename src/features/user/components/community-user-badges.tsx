"use client";

import { Badge } from "@/components/ui/badge";
import { UserProfileTable } from "@/db/schema";
import { HourglassIcon, LinkIcon, MapPinIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

export const CommunityUserBadges = ({
  profile,
}: {
  profile: typeof UserProfileTable.$inferSelect;
}) => {
  const router = useRouter();

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
        <Badge
          variant="outline"
          onClick={(e) => {
            if (!profile.portfolioUrl) return;
            e.stopPropagation();
            router.push(profile.portfolioUrl);
          }}
        >
          <LinkIcon />
          <span>Portfolio</span>
        </Badge>
      )}
      {profile.githubUrl && (
        <Badge
          variant="outline"
          onClick={(e) => {
            if (!profile.githubUrl) return;
            e.stopPropagation();
            router.push(profile.githubUrl);
          }}
        >
          <FaGithub />
          <span>GitHub</span>
        </Badge>
      )}
      {profile.linkedinUrl && (
        <Badge
          variant="outline"
          onClick={(e) => {
            if (!profile.linkedinUrl) return;
            e.stopPropagation();
            router.push(profile.linkedinUrl);
          }}
        >
          <FaLinkedin />
          <span>LinkedIn</span>
        </Badge>
      )}
    </div>
  );
};
