import type { CommunityProblemStatusType, UserProfileTable } from "@/db/schema";
import {
  ProgrammingLanguageType,
  UserAvailabilityDayType,
  UserAvailabilityTimeOfDayType,
  UserCollaborationStyleType,
  UserExperienceLevelType,
  UserGoalType,
  UserLookingForType,
  UserMeetupPreferenceType,
} from "@/db/shared";
import {
  CommunityFilterByOptionType,
  CommunitySortByOptionType,
  HasGithubUrlFilterOptionType,
  HasLinkedinUrlFilterOptionType,
  HasPortfolioUrlFilterOptionType,
} from "./params";
import type { User } from "@/lib/auth/auth";
import {
  FriendChatsFilterByOptionType,
  FriendChatsSortByOptionType,
} from "@/features/chats/lib/friend-chat-params";
import { ArchiveIcon, EarthIcon, LockIcon } from "lucide-react";

export type DiscoverUsersPromptUser = User & {
  profile: typeof UserProfileTable.$inferSelect;
};

const formatPromptValue = (value: unknown) => {
  if (value == null || value === "") return "Not provided";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const formatProfileForPrompt = (user: DiscoverUsersPromptUser) => {
  const { profile } = user;

  return [
    `- User ID: ${user.id}`,
    `- Name: ${user.name}`,
    `- Preferred language: ${formatPromptValue(profile.preferredLanguage)}`,
    `- Years programming: ${formatPromptValue(profile.yearsProgramming)}`,
    `- Experience level: ${formatPromptValue(profile.experienceLevel)}`,
    `- Bio: ${formatPromptValue(profile.bio)}`,
    `- Timezone: ${formatPromptValue(profile.timezone)}`,
    `- Location: ${formatPromptValue(profile.location)}`,
    `- Meetup preference: ${formatPromptValue(profile.meetupPreference)}`,
    `- Collaboration style: ${formatPromptValue(profile.collaborationStyle)}`,
    `- Looking for: ${formatPromptValue(profile.lookingFor)}`,
    `- Availability: ${formatPromptValue(profile.availability)}`,
    `- Goals: ${formatPromptValue(profile.goals)}`,
    `- GitHub URL: ${formatPromptValue(profile.githubUrl)}`,
    `- Portfolio URL: ${formatPromptValue(profile.portfolioUrl)}`,
    `- LinkedIn URL: ${formatPromptValue(profile.linkedinUrl)}`,
  ].join("\n");
};

export const formatProgrammingLanguage = (lang: ProgrammingLanguageType) => {
  switch (lang) {
    case "python":
      return "Python";
    case "javascript":
      return "JavaScript";
    case "java":
      return "Java";
    case "cpp":
      return "C++";
    case "typescript":
      return "TypeScript";
    default:
      throw new Error(`Unknown language: ${lang satisfies never}`);
  }
};

export const formatUserExperienceLevel = (level: UserExperienceLevelType) => {
  switch (level) {
    case "beginner":
      return "Beginner";
    case "junior":
      return "Junior";
    case "senior":
      return "Senior";
    default:
      throw new Error(`Unknown experience level: ${level satisfies never}`);
  }
};

export const formatUserMeetupPreference = (
  preference: UserMeetupPreferenceType,
) => {
  switch (preference) {
    case "hybrid":
      return "Hybrid";
    case "in_person":
      return "In Person";
    case "remote":
      return "Remote";
    default:
      throw new Error(
        `Unknown meetup preference: ${preference satisfies never}`,
      );
  }
};

export const formatUserCollborationStyle = (
  style: UserCollaborationStyleType,
) => {
  switch (style) {
    case "async":
      return "Async";
    case "brainstorming":
      return "Brainstorming";
    case "code_review":
      return "Code Review";
    case "mentorship":
      return "Mentorship";
    case "pair_programming":
      return "Pair Programming";
    case "project_based":
      return "Project Based";
    case "study_together":
      return "Study Together";
    default:
      throw new Error(`Unknown collaboration style: ${style satisfies never}`);
  }
};

export const formatUserLookingFor = (lookingFor: UserLookingForType) => {
  switch (lookingFor) {
    case "career_networking":
      return "Career Networking";
    case "cofounder":
      return "Cofounder";
    case "collaborators":
      return "Collaborators";
    case "friends":
      return "Friends";
    case "hackathon_team":
      return "Hackathon Team";
    case "mentee":
      return "Mentee";
    case "mentor":
      return "Mentor";
    case "open_source":
      return "Open Source";
    case "study_partner":
      return "Study Partner";
    default:
      throw new Error(`Unknown looking for: ${lookingFor satisfies never}`);
  }
};

export const formatUserAvailabilityDays = (day: UserAvailabilityDayType) => {
  switch (day) {
    case "monday":
      return "Monday";
    case "tuesday":
      return "Tuesday";
    case "wednesday":
      return "Wednesday";
    case "thursday":
      return "Thursday";
    case "friday":
      return "Friday";
    case "saturday":
      return "Saturday";
    case "sunday":
      return "Sunday";
  }
};

export const formatUserAvailabilityTimeOfDay = (
  timeOfDay: UserAvailabilityTimeOfDayType,
) => {
  switch (timeOfDay) {
    case "morning":
      return "Morning";
    case "afternoon":
      return "Afternoon";
    case "evening":
      return "Evening";
    case "late_night":
      return "Late Night";
    default:
      throw new Error(`Unknown time of day: ${timeOfDay satisfies never}`);
  }
};

export const formatUserGoals = (goal: UserGoalType) => {
  switch (goal) {
    case "build_projects":
      return "Build Projects";
    case "contribute_to_open_source":
      return "Contribute to Open Source";
    case "find_collaborators":
      return "Find Collaborators";
    case "find_mentors":
      return "Find Mentors";
    case "join_hackathons":
      return "Join Hackathons";
    case "learn_new_tech":
      return "Learn New Tech";
    case "mentor_others":
      return "Mentor Others";
    case "prepare_for_jobs":
      return "Prepare for Jobs";
    case "start_company":
      return "Start Company";
    default:
      throw new Error(`Unknown user goal: ${goal satisfies never}`);
  }
};

export const formatCommunitySortByOptions = (
  option: CommunitySortByOptionType,
) => {
  switch (option) {
    case "friend_count":
      return "Friend count";
    case "match_count":
      return "Match count";
    case "most_recent":
      return "Most recent";
    case "oldest":
      return "Oldest";
    default:
      throw new Error(
        `Unknown community sort option: ${option satisfies never}`,
      );
  }
};

export const formatCommunityFilterByOptions = (
  option: CommunityFilterByOptionType,
) => {
  switch (option) {
    case "all":
      return "All";
    case "friends":
      return "Friends";
    case "pending_friend_requests":
      return "Pending friend requests";
    default:
      throw new Error(
        `Unknown community filter option: ${option satisfies never}`,
      );
  }
};

export const formatCommunityLinkedinFilterOptions = (
  option: HasLinkedinUrlFilterOptionType,
) => {
  switch (option) {
    case "all":
      return "All";
    case "has_linkedin_url":
      return "Has Linkedin url";
    case "no_linkedin_url":
      return "No Linkedin url";
    default:
      throw new Error(
        `Unknown community linkedin filter option: ${option satisfies never}`,
      );
  }
};

export const formatCommunityPortfolioFilterOptions = (
  option: HasPortfolioUrlFilterOptionType,
) => {
  switch (option) {
    case "all":
      return "All";
    case "has_portfolio_url":
      return "Has portfolio url";
    case "no_portfolio_url":
      return "No portfolio url";
    default:
      throw new Error(
        `Unknown community portfolio filter option: ${option satisfies never}`,
      );
  }
};

export const formatCommunityGithubFilterOptions = (
  option: HasGithubUrlFilterOptionType,
) => {
  switch (option) {
    case "all":
      return "All";
    case "has_github_url":
      return "Has Github url";
    case "no_github_url":
      return "No Github url";
    default:
      throw new Error(
        `Unknown community Github filter option: ${option satisfies never}`,
      );
  }
};

export const formatFriendChatSortByOptions = (
  option: FriendChatsSortByOptionType,
) => {
  switch (option) {
    case "friend_name":
      return "Friend name";
    case "most_messages":
      return "Most messages";
    case "most_recent":
      return "Most recent";
    case "most_recent_activity":
      return "Most recent activity";
    case "oldest":
      return "Oldest";
    case "oldest_activity":
      return "Oldest activity";
    default:
      throw new Error(
        `Unknown friend chat sort by option: ${option satisfies never}`,
      );
  }
};

export const formatFriendChatFilterByOptions = (
  option: FriendChatsFilterByOptionType,
) => {
  switch (option) {
    case "all":
      return "All";
    case "empty":
      return "Empty";
    case "has_messages":
      return "Has messages";
    default:
      throw new Error(
        `Unknown friend chat filter by option: ${option satisfies never}`,
      );
  }
};

export const formatCommunityProblemStatus = (
  status: CommunityProblemStatusType,
) => {
  switch (status) {
    case "archived":
      return {
        label: "Archived",
        description:
          "An archived problem stays in your archives, where only you have access.",
      };
    case "private":
      return {
        label: "Private",
        description:
          "A private problem will remain private to you and others who you grant access to.",
      };
    case "public":
      return {
        label: "Public",
        description:
          "A public problem is viewable by everyone with a Synapse account.",
      };
    default:
      throw new Error(
        `Unknown community problem status: ${status satisfies never}`,
      );
  }
};

export const getVisibilityStatusIcon = (status: CommunityProblemStatusType) => {
  switch (status) {
    case "archived":
      return <ArchiveIcon />;
    case "private":
      return <LockIcon />;
    case "public":
      return <EarthIcon />;
    default:
      throw new Error(`Unknown visibility status: ${status satisfies never}`);
  }
};
