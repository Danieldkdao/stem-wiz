"use server";

import { db } from "@/db/db";
import {
  CommunityProblemInvitationTable,
  CommunityProblemStatusType,
  CommunityProblemTable,
  DifficultyLevelType,
  FriendRequestTable,
  FriendshipTable,
  NotificationPayload,
  ProblemTable,
  ProgrammingLanguageType,
  user,
  UserAvailabilityDayType,
  UserAvailabilityTimeOfDayType,
  UserMatchTable,
  UserProfileTable,
} from "@/db/schema";
import {
  findActiveFriendshipByUsers,
  findActiveFriendshipsByIds,
} from "@/features/friends/server/friendships";
import { insertNotificationDb } from "@/features/notifications/server/notifications-db";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { SortByType } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { discoverUsers } from "@/services/ai/discover-users";
import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  exists,
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
} from "../lib/params";
import {
  getCommunityProblemGlobalTag,
  getCommunityProblemIdTag,
  revalidateCommunityProblemCache,
} from "../server/cache/community-problems";
import { getUserProfileTag } from "../server/cache/user-profiles";
import { getUserGlobalTag, getUserIdTag } from "../server/cache/users";
import { upsertUserProfile } from "../server/user-profiles";
import {
  communityFilterOptionsSchema,
  CommunityFilterOptionsSchemaType,
  communityProblemSchema,
  CommunityProblemSchemaType,
  userProfileSchema,
  UserProfileSchemaType,
} from "./schemas";

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
  filterOptions: CommunityFilterOptionsSchemaType,
  limit = PAGE_SIZE,
) => {
  "use cache";
  cacheTag(getUserGlobalTag());

  const { data, success } =
    communityFilterOptionsSchema.safeParse(filterOptions);
  if (!success) return null;

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
    userIds,
  } = data;

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
    FROM ${FriendshipTable} ft
    WHERE ft.created_from_friend_request_id IS NOT NULL
      AND ft.deleted_at IS NULL
      AND(
        ft.user_one_id = ${user.id}
        OR ft.user_two_id = ${user.id}
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
      FROM ${FriendshipTable} ft
      WHERE ft.created_from_friend_request_id IS NOT NULL
        AND ft.deleted_at IS NULL
        AND (
          (ft.user_one_id = ${userId} AND ft.user_two_id = ${user.id})
          OR
          (ft.user_one_id = ${user.id} AND ft.user_two_id = ${userId})
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

  const userIdsFilter = userIds?.length ? inArray(user.id, userIds) : undefined;

  const whereQuery = and(
    ne(user.id, userId),
    searchFilter,
    preferredLanguageFilter,
    yearsProgrammingLower != null || yearsProgrammingUpper != null
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
    userIdsFilter,
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

export const aiDiscoverUsersAction = async (
  prompt: string,
): Promise<{
  error: boolean;
  message: string;
  userIds?: string[];
  explanation?: string;
}> => {
  const { userId } = await getCurrentUser();
  if (!userId)
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };

  const [userWithProfile] = await db
    .select({
      ...getTableColumns(user),
      profile: getTableColumns(UserProfileTable),
    })
    .from(user)
    .innerJoin(UserProfileTable, eq(UserProfileTable.userId, user.id))
    .where(eq(user.id, userId));

  if (!userWithProfile) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const response = await discoverUsers(userWithProfile, prompt);
  if (!response) {
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  return {
    error: false,
    message: "Success!",
    ...response,
  };
};

export const createCommunityProblemAction = async (
  unsafeData: CommunityProblemSchemaType,
) => {
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = communityProblemSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { status, sharedWithUserIds, ...otherData } = data;

  try {
    const { insertedCommunityProblem, notificationEvents } =
      await db.transaction(async (tx) => {
        const [insertedProblem] = await tx
          .insert(ProblemTable)
          .values(otherData)
          .returning();
        if (!insertedProblem) throw new Error("Failed to create problem.");

        const [insertedCommunityProblem] = await tx
          .insert(CommunityProblemTable)
          .values({
            status,
            problemId: insertedProblem.id,
            authorUserId: userId,
          })
          .returning();
        if (!insertedCommunityProblem)
          throw new Error("Failed to create problem.");

        const notificationEvents: {
          id: string;
          type:
            | "community_problem_shared_with_you"
            | "community_problem_access_revoked";
        }[] = [];
        if (
          insertedCommunityProblem.status === "private" &&
          sharedWithUserIds.length
        ) {
          const existingFriends = await findActiveFriendshipsByIds(
            sharedWithUserIds,
            tx,
          );
          if (existingFriends.length !== sharedWithUserIds.length)
            throw new Error("Invalid friends.");

          const insertedInvitations = await tx
            .insert(CommunityProblemInvitationTable)
            .values(
              sharedWithUserIds.map((friendshipId) => ({
                friendshipId,
                communityProblemId: insertedCommunityProblem.id,
              })),
            )
            .returning();

          if (insertedInvitations.length !== sharedWithUserIds.length)
            throw new Error("Failed to send friend invitations.");

          const insertedNotifications = await Promise.all(
            existingFriends.map((friend) =>
              insertNotificationDb(
                {
                  userId: friend.friend.id,
                  payload: {
                    type: "community_problem_shared_with_you",
                    communityProblemId: insertedCommunityProblem.id,
                    friendshipId: friend.id,
                    title: "New community problem",
                    message: `${userInfo.name} shared a community problem with you: ${insertedProblem.title}`,
                  },
                },
                tx,
              ),
            ),
          );

          notificationEvents.push(
            ...insertedNotifications.map((notification) => ({
              id: notification.id,
              type: "community_problem_shared_with_you" as const,
            })),
          );
        }

        return { insertedCommunityProblem, notificationEvents };
      });

    revalidateCommunityProblemCache(insertedCommunityProblem.id);

    return {
      error: false,
      message: "Community problem created successfully!",
      notificationEvents,
      problemId: insertedCommunityProblem.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateCommunityProblemAction = async (
  problemId: string,
  unsafeData: CommunityProblemSchemaType,
) => {
  if (!areValidIds([problemId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = communityProblemSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { status, sharedWithUserIds, ...otherData } = data;

  try {
    const { updatedCommunityProblem, notificationEvents } =
      await db.transaction(async (tx) => {
        const [updatedCommunityProblem] = await tx
          .update(CommunityProblemTable)
          .set({
            status,
          })
          .where(eq(CommunityProblemTable.id, problemId))
          .returning();
        if (!updatedCommunityProblem)
          throw new Error("Failed to create problem.");

        const [updatedProblem] = await tx
          .update(ProblemTable)
          .set(otherData)
          .where(eq(ProblemTable.id, updatedCommunityProblem.problemId))
          .returning();
        if (!updatedProblem) throw new Error("Failed to create problem.");

        const existingInvitations = await tx
          .select({ id: CommunityProblemInvitationTable.friendshipId })
          .from(CommunityProblemInvitationTable)
          .where(
            eq(
              CommunityProblemInvitationTable.communityProblemId,
              updatedCommunityProblem.id,
            ),
          );

        const existingInvitationFriendshipIds = existingInvitations.map(
          (invitation) => invitation.id,
        );

        const existingFriends = await findActiveFriendshipsByIds(
          sharedWithUserIds,
          tx,
        );
        if (existingFriends.length !== sharedWithUserIds.length)
          throw new Error("Invalid friends.");

        const sharedWithFriendIds = existingFriends.map((friend) => friend.id);

        const notificationEvents: {
          id: string;
          type:
            | "community_problem_shared_with_you"
            | "community_problem_access_revoked";
        }[] = [];

        if (updatedCommunityProblem.status === "private") {
          const friendIdsToAdd = [
            ...new Set(
              sharedWithFriendIds.filter(
                (friendId) =>
                  !existingInvitationFriendshipIds.includes(friendId),
              ),
            ),
          ];
          const friendIdsToRemove = [
            ...new Set(
              existingInvitationFriendshipIds.filter(
                (friendshipId) => !sharedWithFriendIds.includes(friendshipId),
              ),
            ),
          ];

          const [addedInvitations, removedInvitations] = await Promise.all([
            friendIdsToAdd.length
              ? tx
                  .insert(CommunityProblemInvitationTable)
                  .values(
                    friendIdsToAdd.map((friendshipId) => ({
                      friendshipId,
                      communityProblemId: updatedCommunityProblem.id,
                    })),
                  )
                  .returning()
              : undefined,
            friendIdsToRemove.length
              ? tx
                  .delete(CommunityProblemInvitationTable)
                  .where(
                    and(
                      eq(
                        CommunityProblemInvitationTable.communityProblemId,
                        updatedCommunityProblem.id,
                      ),
                      inArray(
                        CommunityProblemInvitationTable.friendshipId,
                        friendIdsToRemove,
                      ),
                    ),
                  )
                  .returning()
              : undefined,
          ]);

          if (
            (friendIdsToAdd.length &&
              friendIdsToAdd.length !== addedInvitations?.length) ||
            (friendIdsToRemove.length &&
              friendIdsToRemove.length !== removedInvitations?.length)
          )
            throw new Error("Failed to update friend invitations.");

          const friendsToNotifyIds = [
            ...new Set([...friendIdsToAdd, ...friendIdsToRemove]),
          ];
          const friendsToNotify = friendsToNotifyIds.length
            ? await findActiveFriendshipsByIds(friendsToNotifyIds, tx)
            : [];

          if (friendsToNotify.length !== friendsToNotifyIds.length) {
            throw new Error("Failed to find friends to notify.");
          }

          const insertedNotifications = await Promise.all(
            friendsToNotify.map((friend) => {
              let payload: NotificationPayload | null = null;
              let type:
                | "community_problem_shared_with_you"
                | "community_problem_access_revoked"
                | null = null;

              if (friendIdsToAdd.includes(friend.id)) {
                payload = {
                  type: "community_problem_shared_with_you",
                  communityProblemId: updatedCommunityProblem.id,
                  friendshipId: friend.id,
                  title: "New community problem",
                  message: `${userInfo.name} shared a community problem with you: ${updatedProblem.title}`,
                };
                type = "community_problem_shared_with_you";
              } else if (friendIdsToRemove.includes(friend.id)) {
                payload = {
                  type: "community_problem_access_revoked",
                  communityProblemId: updatedCommunityProblem.id,
                  friendshipId: friend.id,
                  title: "Community problem removed",
                  message: `${userInfo.name} revoked your access to the community problem: ${updatedProblem.title}`,
                };
                type = "community_problem_access_revoked";
              } else {
                throw new Error("Failed to send notifications.");
              }

              if (!type) throw new Error("Failed to send notifications.");
              return insertNotificationDb(
                {
                  userId: friend.friend.id,
                  payload,
                },
                tx,
              ).then((notification) => ({ id: notification.id, type }));
            }),
          );

          notificationEvents.push(...insertedNotifications);
        }

        return { updatedCommunityProblem, notificationEvents };
      });

    revalidateCommunityProblemCache(updatedCommunityProblem.id);

    return {
      error: false,
      message: "Community problem updated successfully!",
      notificationEvents,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getCommunityProblemsAction = async (
  userId: string,
  filterOptions: {
    search: string;
    sortBy: SortByType;
    languages: ProgrammingLanguageType[];
    difficulty: DifficultyLevelType[];
    statuses: CommunityProblemStatusType[];
    page: number;
  },
) => {
  "use cache";
  cacheTag(getCommunityProblemGlobalTag());

  const { search, sortBy, languages, difficulty, statuses, page } =
    filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const sortByMap: Record<SortByType, SQL<unknown>> = {
    most_recent: desc(CommunityProblemTable.createdAt),
    oldest: asc(CommunityProblemTable.createdAt),
  };

  const searchPattern = `%${search.trim()}%`;

  const problemConceptsSearch = sql`
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(${ProblemTable.concepts}) AS concept(value)
      WHERE concept.value ILIKE ${searchPattern}
    )
  `;
  const searchQuery = search.trim()
    ? or(
        ilike(user.name, searchPattern),
        ilike(ProblemTable.title, searchPattern),
        ilike(ProblemTable.description, searchPattern),
        problemConceptsSearch,
      )
    : undefined;

  const hasPrivateProblemAccess = exists(
    db
      .select()
      .from(CommunityProblemInvitationTable)
      .innerJoin(
        FriendshipTable,
        eq(FriendshipTable.id, CommunityProblemInvitationTable.friendshipId),
      )
      .where(
        and(
          eq(
            CommunityProblemInvitationTable.communityProblemId,
            CommunityProblemTable.id,
          ),
          or(
            and(
              eq(FriendshipTable.userOneId, userId),
              eq(FriendshipTable.userTwoId, CommunityProblemTable.authorUserId),
            ),
            and(
              eq(FriendshipTable.userOneId, CommunityProblemTable.authorUserId),
              eq(FriendshipTable.userTwoId, userId),
            ),
          ),
        ),
      ),
  );

  const statusMap: Record<
    CommunityProblemStatusType,
    SQL<unknown> | undefined
  > = {
    archived: and(
      eq(user.id, userId),
      eq(CommunityProblemTable.status, "archived"),
    ),
    private: and(
      eq(CommunityProblemTable.status, "private"),
      or(
        eq(CommunityProblemTable.authorUserId, userId),
        hasPrivateProblemAccess,
      ),
    ),
    public: eq(CommunityProblemTable.status, "public"),
  };

  const whereQuery = and(
    searchQuery,
    languages.length
      ? inArray(ProblemTable.programmingLanguage, languages)
      : undefined,
    difficulty.length
      ? inArray(ProblemTable.difficultyLevel, difficulty)
      : undefined,
    statuses.length
      ? or(...statuses.map((status) => statusMap[status]))
      : or(
          eq(CommunityProblemTable.status, "public"),
          eq(CommunityProblemTable.authorUserId, userId),
          hasPrivateProblemAccess,
        ),
  );

  const communityProblems = await db
    .select({
      ...getTableColumns(CommunityProblemTable),
      problem: getTableColumns(ProblemTable),
      invitations: sql<
        (typeof CommunityProblemInvitationTable.$inferSelect)[]
      >`(
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', cpit.id,
              'friendshipId', cpit.friendship_id,
              'communityProblemId', cpit.community_problem_id,
              'createdAt', cpit.created_at,
              'updatedAt', cpit.updated_at
            )
          ),
          '[]'::jsonb
        )
        FROM ${CommunityProblemInvitationTable} cpit
        WHERE cpit.community_problem_id = ${CommunityProblemTable.id}
      )`,
      author: getTableColumns(user),
      isCurrentUserAuthor: sql<boolean>`${user.id} = ${userId}`,
    })
    .from(CommunityProblemTable)
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, CommunityProblemTable.problemId),
    )
    .innerJoin(user, eq(user.id, CommunityProblemTable.authorUserId))
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalCommunityProblems] = await db
    .select({
      count: count(),
    })
    .from(CommunityProblemTable)
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, CommunityProblemTable.problemId),
    )
    .innerJoin(user, eq(user.id, CommunityProblemTable.authorUserId))
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalCommunityProblems.count;

  return {
    communityProblems,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const getCommunityProblemAction = async (problemId: string) => {
  "use cache";
  cacheTag(getCommunityProblemIdTag(problemId));

  if (!areValidIds([problemId])) return null;

  const communityProblem = await db.query.CommunityProblemTable.findFirst({
    where: eq(CommunityProblemTable.id, problemId),
    with: {
      author: {
        with: {
          profile: true,
        },
      },
      problem: true,
    },
  });

  return communityProblem ?? null;
};

export const hasPermissionToViewCommunityProblemAction = async (
  communityProblemId: string,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return false;

  const existingCommunityProblem =
    await db.query.CommunityProblemTable.findFirst({
      where: eq(CommunityProblemTable.id, communityProblemId),
    });
  if (!existingCommunityProblem) return false;

  switch (existingCommunityProblem.status) {
    case "public":
      return true;
    case "archived":
      return existingCommunityProblem.authorUserId === userId;
    case "private":
      if (existingCommunityProblem.authorUserId === userId) return true;
      const existingFriendship = await findActiveFriendshipByUsers(
        existingCommunityProblem.authorUserId,
        userId,
      );
      if (!existingFriendship) return false;
      const existingCommunityProblemInvitation =
        await db.query.CommunityProblemInvitationTable.findFirst({
          where: and(
            eq(
              CommunityProblemInvitationTable.communityProblemId,
              existingCommunityProblem.id,
            ),
            eq(
              CommunityProblemInvitationTable.friendshipId,
              existingFriendship.id,
            ),
          ),
        });
      return !!existingCommunityProblemInvitation;
  }
};

export const deleteCommunityProblemAction = async (
  communityProblemId: string,
) => {
  if (!areValidIds([communityProblemId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  try {
    const notificationIds: string[] = [];
    const deletedCommunityProblem = await db.transaction(async (tx) => {
      const [existingCommunityProblem] = await tx
        .select()
        .from(CommunityProblemTable)
        .where(
          and(
            eq(CommunityProblemTable.id, communityProblemId),
            eq(CommunityProblemTable.authorUserId, userId),
          ),
        );
      if (!existingCommunityProblem) throw new Error(NOT_FOUND_ERROR_MESSAGE);
      const [existingProblem] = await tx
        .select()
        .from(ProblemTable)
        .where(eq(ProblemTable.id, existingCommunityProblem.problemId));
      if (!existingProblem) throw new Error(NOT_FOUND_ERROR_MESSAGE);
      const existingProblemInvitations = await tx
        .select({
          ...getTableColumns(CommunityProblemInvitationTable),
          otherUserId: user.id,
        })
        .from(CommunityProblemInvitationTable)
        .innerJoin(
          FriendshipTable,
          eq(FriendshipTable.id, CommunityProblemInvitationTable.friendshipId),
        )
        .innerJoin(
          user,
          or(
            and(
              eq(FriendshipTable.userOneId, userId),
              eq(FriendshipTable.userTwoId, user.id),
            ),
            and(
              eq(FriendshipTable.userOneId, user.id),
              eq(FriendshipTable.userTwoId, userId),
            ),
          ),
        )
        .where(
          eq(
            CommunityProblemInvitationTable.communityProblemId,
            communityProblemId,
          ),
        );
      const deletedCommunityProblemInvitations = await tx
        .delete(CommunityProblemInvitationTable)
        .where(
          and(
            inArray(
              CommunityProblemInvitationTable.id,
              existingProblemInvitations.map((invitation) => invitation.id),
            ),
            eq(
              CommunityProblemInvitationTable.communityProblemId,
              communityProblemId,
            ),
          ),
        )
        .returning();
      if (
        deletedCommunityProblemInvitations.length !==
        existingProblemInvitations.length
      )
        throw new Error("Failed to delete invitations.");
      if (existingProblemInvitations.length) {
        const insertedNotifications = await Promise.all(
          existingProblemInvitations.map((invitation) => {
            return insertNotificationDb(
              {
                userId: invitation.otherUserId,
                payload: {
                  type: "community_problem_deleted",
                  friendshipId: invitation.friendshipId,
                  title: "Community problem deleted",
                  message: `${userInfo.name} deleted the community problem "${existingProblem.title}".`,
                },
              },
              tx,
            ).then((notification) => notificationIds.push(notification.id));
          }),
        );
        if (insertedNotifications.length !== existingProblemInvitations.length)
          throw new Error("Failed to create notifications.");
      }

      const [deletedCommunityProblem] = await tx
        .delete(CommunityProblemTable)
        .where(
          and(
            eq(CommunityProblemTable.id, existingCommunityProblem.id),
            eq(CommunityProblemTable.authorUserId, userId),
          ),
        )
        .returning();
      if (!deletedCommunityProblem)
        throw new Error("Failed to delete community problem.");

      const [deletedProblem] = await tx
        .delete(ProblemTable)
        .where(eq(ProblemTable.id, existingProblem.id))
        .returning();
      if (!deletedProblem) throw new Error("Failed to delete problem.");

      return deletedCommunityProblem;
    });

    revalidateCommunityProblemCache(deletedCommunityProblem.id);

    return {
      error: false,
      message: "Problem deleted successfully.",
      notificationIds,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
