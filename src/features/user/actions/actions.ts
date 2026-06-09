"use server";

import { db } from "@/db/db";
import {
  FriendRequestTable,
  ProgrammingLanguageType,
  user,
  UserAvailabilityDayType,
  UserAvailabilityTimeOfDayType,
  UserCollaborationStyleType,
  UserExperienceLevelType,
  UserGoalType,
  UserLookingForType,
  UserMatchTable,
  UserMeetupPreferenceType,
  UserProfileTable,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import {
  CommunityFilterByOptionType,
  CommunitySortByOptionType,
  HasGithubUrlFilterOptionType,
  HasLinkedinUrlFilterOptionType,
  HasPortfolioUrlFilterOptionType,
  UserAvailabilityFilterSchemaType,
} from "../lib/params";
import { getUserProfileTag } from "../server/cache/user-profiles";
import { getUserGlobalTag, getUserIdTag } from "../server/cache/users";
import { upsertUserProfile } from "../server/user-profiles";
import { userProfileSchema, UserProfileSchemaType } from "./schemas";

export const upsertUserProfileAction = async (
  unsafeData: UserProfileSchemaType,
) => {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = userProfileSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const response = await upsertUserProfile({ ...data, userId });

    if (!response) {
      throw new Error("Failed to update user settings.");
    }

    return {
      error: false,
      message: "User settings updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getUserProfileAction = async (userId: string) => {
  "use cache";
  cacheTag(getUserProfileTag(userId));

  const [existingUserProfile] = await db
    .select()
    .from(UserProfileTable)
    .where(eq(UserProfileTable.userId, userId));

  return existingUserProfile ?? null;
};

export const getUsersAction = async (
  userId: string,
  filterOptions: {
    search: string;
    sortBy: CommunitySortByOptionType;
    filterBy: CommunityFilterByOptionType;
    preferredLanguages: ProgrammingLanguageType[];
    yearsProgrammingLower: number | null | undefined;
    yearsProgrammingUpper: number | null | undefined;
    experienceLevels: UserExperienceLevelType[];
    meetupPreferences: UserMeetupPreferenceType[];
    collaborationStyles: UserCollaborationStyleType[];
    lookingFor: UserLookingForType[];
    availability: UserAvailabilityFilterSchemaType;
    goals: UserGoalType[];
    hasGithubUrl: HasGithubUrlFilterOptionType;
    hasPortfolioUrl: HasPortfolioUrlFilterOptionType;
    hasLinkedinUrl: HasLinkedinUrlFilterOptionType;
    page: number;
  },
  limit = PAGE_SIZE,
) => {
  "use cache";
  cacheTag(getUserGlobalTag());

  const {
    search,
    page,
    sortBy,
    filterBy,
    preferredLanguages,
    yearsProgrammingLower,
    yearsProgrammingUpper,
    experienceLevels,
    meetupPreferences,
    collaborationStyles,
    lookingFor,
    availability,
    goals,
    hasGithubUrl,
    hasPortfolioUrl,
    hasLinkedinUrl,
  } = filterOptions;

  const offset = (page - 1) * limit;

  const searchFilter = search.trim()
    ? ilike(user.name, `%${search.trim()}%`)
    : undefined;
  const preferredLanguageFilter = preferredLanguages.length
    ? inArray(UserProfileTable.preferredLanguage, preferredLanguages)
    : undefined;
  const yearsProgrammingLowerFilter =
    yearsProgrammingLower != null && yearsProgrammingLower >= 0
      ? gte(UserProfileTable.yearsProgramming, yearsProgrammingLower)
      : undefined;
  const yearsProgrammingUpperFilter =
    yearsProgrammingUpper != null
      ? lte(UserProfileTable.yearsProgramming, yearsProgrammingUpper)
      : undefined;
  const experienceLevelFilter = experienceLevels.length
    ? inArray(UserProfileTable.experienceLevel, experienceLevels)
    : undefined;
  const meetupPreferenceFilter = meetupPreferences.length
    ? inArray(UserProfileTable.meetupPreference, meetupPreferences)
    : undefined;
  const collaborationStyleFilter = collaborationStyles.length
    ? inArray(UserProfileTable.collaborationStyle, collaborationStyles)
    : undefined;
  const lookingForFilter = lookingFor.length
    ? inArray(UserProfileTable.lookingFor, lookingFor)
    : undefined;
  const goalFilter = goals.length
    ? arrayOverlaps(UserProfileTable.goals, goals)
    : undefined;

  const availabilityDays = sql<
    UserAvailabilityDayType[]
  >`(${UserProfileTable.availability}->'days')`;
  const availabilityTimeOfDay = sql<
    UserAvailabilityTimeOfDayType[]
  >`(${UserProfileTable.availability}->'timeOfDay')`;
  const availabilityHoursPerWeek = sql<
    number | null | undefined
  >`(${UserProfileTable.availability}->'hoursPerWeek')::int`;

  const availabilityDaysFilter = availability?.days?.length
    ? arrayOverlaps(availabilityDays, availability.days)
    : undefined;
  const availabilityTimeOfDayFilter = availability?.timeOfDay?.length
    ? arrayOverlaps(availabilityTimeOfDay, availability.timeOfDay)
    : undefined;
  const availabilityHoursPerWeekLowerFilter = availability?.hoursPerWeekLower
    ? gte(availabilityHoursPerWeek, availability.hoursPerWeekLower)
    : undefined;
  const availabilityHoursPerWeekUpperFilter = availability?.hoursPerWeekUpper
    ? lte(availabilityHoursPerWeek, availability.hoursPerWeekUpper)
    : undefined;

  const hasGithubUrlMap: Record<
    HasGithubUrlFilterOptionType,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    has_github_url: isNotNull(UserProfileTable.githubUrl),
    no_github_url: isNull(UserProfileTable.githubUrl),
  };

  const hasPortfolioUrlMap: Record<
    HasPortfolioUrlFilterOptionType,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    has_portfolio_url: isNotNull(UserProfileTable.portfolioUrl),
    no_portfolio_url: isNull(UserProfileTable.portfolioUrl),
  };

  const hasLinkedinUrlMap: Record<
    HasLinkedinUrlFilterOptionType,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    has_linkedin_url: isNotNull(UserProfileTable.linkedinUrl),
    no_linkedin_url: isNull(UserProfileTable.linkedinUrl),
  };

  const matchCount = sql<number>`(
    SELECT COUNT(*)::int
    FROM ${UserMatchTable} umt
    WHERE umt.user_id = ${user.id}
  )`.mapWith(Number);

  const friendCount = sql<number>`(
    SELECT COUNT(*)::int
    FROM ${FriendRequestTable} frt
    WHERE frt.status = 'accepted'
      AND(
        frt.from_user_id = ${user.id}
        OR frt.to_user_id = ${user.id}
      )
  )`.mapWith(Number);

  const sortByMap: Record<CommunitySortByOptionType, SQL<unknown>> = {
    most_recent: desc(user.createdAt),
    oldest: asc(user.createdAt),
    match_count: desc(matchCount),
    friend_count: desc(friendCount),
  };

  const friendsFilter = sql`
    EXISTS (
      SELECT 1
      FROM ${FriendRequestTable} frt
      WHERE frt.status = 'accepted'
        AND (
          (frt.from_user_id = ${userId} AND frt.to_user_id = ${user.id})
          OR
          (frt.from_user_id = ${user.id} AND frt.to_user_id = ${userId})
        )
    )
  `;
  const pendingFriendsFilter = sql`
    EXISTS (
      SELECT 1
      FROM ${FriendRequestTable} frt
      WHERE frt.status = 'pending'
        AND (
          (frt.from_user_id = ${userId} AND frt.to_user_id = ${user.id})
          OR
          (frt.from_user_id = ${user.id} AND frt.to_user_id = ${userId})
        )
    )
  `;

  const filterByMap: Record<
    CommunityFilterByOptionType,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    friends: friendsFilter,
    pending_friend_requests: pendingFriendsFilter,
  };

  const whereQuery = and(
    ne(user.id, userId),
    searchFilter,
    preferredLanguageFilter,
    yearsProgrammingLower != null || yearsProgrammingUpper !== null
      ? or(
          and(yearsProgrammingLowerFilter, yearsProgrammingUpperFilter),
          isNull(UserProfileTable.yearsProgramming),
        )
      : undefined,
    experienceLevelFilter,
    meetupPreferenceFilter,
    collaborationStyleFilter,
    lookingForFilter,
    goalFilter,
    availabilityDaysFilter,
    availabilityTimeOfDayFilter,
    availability?.hoursPerWeekLower != null ||
      availability?.hoursPerWeekUpper != null
      ? or(
          and(
            availabilityHoursPerWeekLowerFilter,
            availabilityHoursPerWeekUpperFilter,
          ),
          isNull(availabilityHoursPerWeek),
        )
      : undefined,
    hasGithubUrlMap[hasGithubUrl],
    hasPortfolioUrlMap[hasPortfolioUrl],
    hasLinkedinUrlMap[hasLinkedinUrl],
    filterByMap[filterBy],
  );

  const users = await db
    .select({
      ...getTableColumns(user),
      profile: getTableColumns(UserProfileTable),
    })
    .from(user)
    .innerJoin(UserProfileTable, eq(UserProfileTable.userId, user.id))
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(limit);

  const [totalUsers] = await db
    .select({
      count: count(),
    })
    .from(user)
    .innerJoin(UserProfileTable, eq(UserProfileTable.userId, user.id))
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalUsers.count;

  return {
    users,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const getUserAction = async (
  userId: string,
  currentUserId?: string | null,
) => {
  "use cache";
  cacheTag(getUserIdTag(userId));

  const [existingUser] = await db
    .select({
      ...getTableColumns(user),
      profile: getTableColumns(UserProfileTable),
      existingFriendRequest: sql<typeof FriendRequestTable.$inferSelect>`
          (
            SELECT 
                jsonb_build_object(
                'id', fr.id,
                'fromUserId', fr.from_user_id,
                'toUserId', fr.to_user_id,
                'status', fr.status,
                'respondedAt', fr.responded_at,
                'createdAt', fr.created_at,
                'updatedAt', fr.updated_at
              )
            FROM ${FriendRequestTable} fr
            WHERE
              ((fr.from_user_id = ${user.id} AND fr.to_user_id = ${currentUserId})
              OR
              (fr.to_user_id = ${user.id} AND fr.from_user_id = ${currentUserId}))
              AND fr.status != 'rejected'
            LIMIT 1
          )
      `,
    })
    .from(user)
    .innerJoin(UserProfileTable, eq(UserProfileTable.userId, user.id))
    .where(eq(user.id, userId));

  return existingUser ?? null;
};
