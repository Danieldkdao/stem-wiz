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
} from "./params";

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
