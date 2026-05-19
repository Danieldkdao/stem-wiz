"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { upsertUserProfile } from "../server/user-profiles";
import { userProfileSchema, UserProfileSchemaType } from "./schemas";
import { db } from "@/db/db";
import { user, UserProfileTable } from "@/db/schema";
import { eq, getTableColumns } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getUserProfileTag } from "../server/cache/user-profiles";
import { getUserGlobalTag, getUserIdTag } from "../server/cache/users";

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

export const getUsersAction = async () => {
  "use cache";
  cacheTag(getUserGlobalTag());

  const users = await db
    .select({
      ...getTableColumns(user),
      profile: getTableColumns(UserProfileTable),
    })
    .from(user)
    .innerJoin(UserProfileTable, eq(UserProfileTable.userId, user.id));

  return users;
};

export const getUserAction = async (userId: string) => {
  "use cache";
  cacheTag(getUserIdTag(userId));

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      profile: true,
    },
  });

  return existingUser ?? null;
};
