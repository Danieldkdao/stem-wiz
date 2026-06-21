import { db, DbTransaction } from "@/db/db";
import { FriendRequestTable, FriendshipTable, user } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq, getTableColumns, inArray, isNull, or } from "drizzle-orm";

type FindFriendshipReturnType = Promise<
  | (typeof FriendshipTable.$inferSelect & {
      friendRequest: typeof FriendRequestTable.$inferSelect | null;
      friend: User;
    })
  | null
>;

const sortUserIds = (userIds: [string, string]) => {
  const [userOneId, userTwoId] = userIds;
  const sortedUserIds =
    userOneId < userTwoId ? [userOneId, userTwoId] : [userTwoId, userOneId];

  return sortedUserIds;
};

export const findActiveFriendshipsByIds = async (
  friendIds: string[],
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return [];
  const existingFriends = await (tx ?? db)
    .select({
      ...getTableColumns(FriendshipTable),
      friend: getTableColumns(user),
    })
    .from(FriendshipTable)
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
    .where(inArray(FriendshipTable.id, friendIds));

  return existingFriends;
};

export const findActiveFriendshipById = async (
  friendshipId: string,
  userId: string,
): FindFriendshipReturnType => {
  const [existingFriendship] = await db
    .select({
      ...getTableColumns(FriendshipTable),
      friend: getTableColumns(user),
      friendRequest: getTableColumns(FriendRequestTable),
    })
    .from(FriendshipTable)
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
    .leftJoin(
      FriendRequestTable,
      eq(FriendRequestTable.id, FriendshipTable.createdFromFriendRequestId),
    )
    .where(
      and(
        or(
          eq(FriendshipTable.userOneId, userId),
          eq(FriendshipTable.userTwoId, userId),
        ),
        isNull(FriendshipTable.deletedAt),
        eq(FriendshipTable.id, friendshipId),
      ),
    );

  return existingFriendship ?? null;
};

export const findActiveFriendshipByUsers = async (
  userOneId: string,
  userTwoIdOptional?: string,
): FindFriendshipReturnType => {
  const { userId } = await getCurrentUser();
  const userTwoId = userTwoIdOptional ?? userId;
  if (!userTwoId) return null;

  const [existingFriendship] = await db
    .select({
      ...getTableColumns(FriendshipTable),
      friend: getTableColumns(user),
      friendRequest: getTableColumns(FriendRequestTable),
    })
    .from(FriendshipTable)
    .innerJoin(
      user,
      or(
        and(
          eq(FriendshipTable.userOneId, userTwoId),
          eq(FriendshipTable.userTwoId, user.id),
        ),
        and(
          eq(FriendshipTable.userOneId, user.id),
          eq(FriendshipTable.userTwoId, userTwoId),
        ),
      ),
    )
    .leftJoin(
      FriendRequestTable,
      eq(FriendRequestTable.id, FriendshipTable.createdFromFriendRequestId),
    )
    .where(
      and(
        or(
          and(
            eq(FriendshipTable.userOneId, userOneId),
            eq(FriendshipTable.userTwoId, userTwoId),
          ),
          and(
            eq(FriendshipTable.userOneId, userTwoId),
            eq(FriendshipTable.userTwoId, userOneId),
          ),
        ),
        isNull(FriendshipTable.deletedAt),
      ),
    );

  return existingFriendship ?? null;
};

export const insertFriendshipDb = async (
  userOneId: string,
  userTwoId: string,
  friendRequestId: string,
  tx?: DbTransaction,
) => {
  const [sortedUserOneId, sortedUserTwoId] = sortUserIds([
    userOneId,
    userTwoId,
  ]);
  const [insertedFriendship] = await (tx ?? db)
    .insert(FriendshipTable)
    .values({
      userOneId: sortedUserOneId,
      userTwoId: sortedUserTwoId,
      createdFromFriendRequestId: friendRequestId,
    })
    .onConflictDoNothing()
    .returning();

  return insertedFriendship;
};
