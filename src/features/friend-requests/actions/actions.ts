"use server";

import { db } from "@/db/db";
import { FriendRequestTable, user } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { and, eq } from "drizzle-orm";
import { insertFriendRequest } from "../server/friend-requests";

export const createFriendRequestAction = async (friendUserId: string) => {
  const { userId, user: currentUser } = await getCurrentUser({ allData: true });
  if (!userId || !currentUser) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }
  if (userId === friendUserId) {
    return {
      error: true,
      message: "You cannot send a friend request to yourself.",
    };
  }

  const [existingUserToFriend] = await db
    .select()
    .from(user)
    .where(eq(user.id, friendUserId));

  if (!existingUserToFriend) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.fromUserId, userId),
        eq(FriendRequestTable.toUserId, friendUserId),
        eq(FriendRequestTable.status, "pending"),
      ),
    );

  if (existingFriendRequest) {
    return {
      error: true,
      message: "You have already sent a friend request to this user.",
    };
  }

  try {
    const notification = await insertFriendRequest(
      currentUser.id,
      currentUser.name,
      {
        fromUserId: userId,
        toUserId: friendUserId,
      },
    );

    return {
      error: false,
      message: "Friend request sent successfully!",
      notificationId: notification.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
