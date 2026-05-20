"use server";

import { db } from "@/db/db";
import { user } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { eq } from "drizzle-orm";
import { insertFriendRequest } from "../server/friend-requests";

export const createFriendRequestAction = async (friendUserId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingUserToFriend] = await db
    .select()
    .from(user)
    .where(eq(user.id, friendUserId));

  if (!existingUserToFriend) {
    return {
      error: true,
      message: NOT_FOUND_MESSAGE,
    };
  }

  try {
    const insertedFriendRequest = await insertFriendRequest({
      fromUserId: userId,
      toUserId: friendUserId,
    });
    if (!insertedFriendRequest) {
      throw new Error("Failed to create friend request.");
    }

    return {
      error: false,
      message: "Friend request created successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
