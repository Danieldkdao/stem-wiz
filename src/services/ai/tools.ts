import { getUsersAction } from "@/features/user/actions/actions";
import { communityFilterOptionsSchema } from "@/features/user/actions/schemas";
import { getCurrentUser } from "@/lib/auth/helpers";
import { tool } from "ai";

type UsersActionResponse = NonNullable<
  Awaited<ReturnType<typeof getUsersAction>>
>;
type UserResult = UsersActionResponse["users"][number];

export type AiUserCandidate = {
  id: string;
  name: string;
  createdAt: string;
  profile: {
    preferredLanguage: UserResult["profile"]["preferredLanguage"];
    experienceLevel: UserResult["profile"]["experienceLevel"];
    yearsProgramming: UserResult["profile"]["yearsProgramming"];
    location: UserResult["profile"]["location"];
    timezone: UserResult["profile"]["timezone"];
    lookingFor: UserResult["profile"]["lookingFor"];
    meetupPreference: UserResult["profile"]["meetupPreference"];
    collaborationStyle: UserResult["profile"]["collaborationStyle"];
    goals: UserResult["profile"]["goals"];
    availability: UserResult["profile"]["availability"];
    githubUrl: UserResult["profile"]["githubUrl"];
    portfolioUrl: UserResult["profile"]["portfolioUrl"];
    linkedinUrl: UserResult["profile"]["linkedinUrl"];
    bio: UserResult["profile"]["bio"];
  };
};

export type FetchUsersToolOutput = {
  ok: boolean;
  message: string;
  users: AiUserCandidate[];
  metadata: UsersActionResponse["metadata"] | null;
  error?: "not_signed_in" | "fetch_failed";
};

const toAiUserCandidate = (userResult: UserResult): AiUserCandidate => {
  const { profile, ...user } = userResult;

  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    profile: {
      preferredLanguage: profile.preferredLanguage,
      experienceLevel: profile.experienceLevel,
      yearsProgramming: profile.yearsProgramming,
      location: profile.location,
      timezone: profile.timezone,
      lookingFor: profile.lookingFor,
      meetupPreference: profile.meetupPreference,
      collaborationStyle: profile.collaborationStyle,
      goals: profile.goals,
      availability: profile.availability,
      githubUrl: profile.githubUrl,
      portfolioUrl: profile.portfolioUrl,
      linkedinUrl: profile.linkedinUrl,
      bio: profile.bio,
    },
  };
};

export const fetchUsers = tool({
  description: "Fetch users from the database",
  inputSchema: communityFilterOptionsSchema,
  execute: async (filterOptions) => {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return {
        ok: false,
        message:
          "This user is not signed in. Tell them they must be signed in to use this feature.",
        users: [],
        metadata: null,
        error: "not_signed_in",
      } satisfies FetchUsersToolOutput;
    }

    const response = await getUsersAction(userId, filterOptions);

    if (!response)
      return {
        ok: false,
        message:
          "Failed to get users. Try again with different filters or input.",
        users: [],
        metadata: null,
        error: "fetch_failed",
      } satisfies FetchUsersToolOutput;

    return {
      ok: true,
      message: response.users.length
        ? `Found ${response.users.length} user${
            response.users.length === 1 ? "" : "s"
          }.`
        : "No users matched the filters.",
      users: response.users.map(toAiUserCandidate),
      metadata: response.metadata,
    } satisfies FetchUsersToolOutput;
  },
});
