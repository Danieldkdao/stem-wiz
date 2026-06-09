"use server";

import { db } from "@/db/db";
import { ChatTable, FriendRequestTable } from "@/db/schema";
import {
  confirmExistingMatch,
  isUserMatchActive,
} from "@/features/matches/actions/actions";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { and, eq, or } from "drizzle-orm";
import { insertChatMessage } from "../server/chat-messages";
import { insertChatDb, updateChatDb } from "../server/chats";
import {
  chatInputSchema,
  ChatInputSchemaType,
  friendChatSchema,
  FriendChatSchemaType,
} from "./schemas";

export const createMatchChatMessageAction = async (
  matchId: string,
  unsafeData: ChatInputSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingMatch = await confirmExistingMatch(matchId);
  if (!existingMatch) {
    return {
      error: true,
      message: "This match has already ended.",
    };
  }

  const userMatch = await isUserMatchActive(existingMatch.id);
  if (userMatch) {
    return {
      error: true,
      message: "You cannot chat because you are participating in this match.",
    };
  }

  const { data, success } = chatInputSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  let existingChatId = null;

  const [existingMatchChat] = await db
    .select({ id: ChatTable.id })
    .from(ChatTable)
    .where(eq(ChatTable.matchId, existingMatch.id));

  if (existingMatchChat) {
    existingChatId = existingMatchChat.id;
  } else {
    const insertedChat = await insertChatDb({ matchId: existingMatch.id });
    existingChatId = insertedChat.id;
  }

  try {
    const insertedChatMessage = await insertChatMessage({
      userId: userId,
      chatId: existingChatId,
      text: data.text,
    });

    if (!insertedChatMessage) {
      throw new Error("Failed to insert chat message.");
    }

    return {
      error: false,
      message: "Chat message created successfully!",
      chatMessage: insertedChatMessage,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const createFriendChatAction = async (
  unsafeData: FriendChatSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = friendChatSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, data.friendRequestId),
        eq(FriendRequestTable.status, "accepted"),
        or(
          eq(FriendRequestTable.fromUserId, userId),
          eq(FriendRequestTable.toUserId, userId),
        ),
      ),
    );
  if (!existingFriendRequest) {
    return {
      error: true,
      message: "Invalid friend selection",
    };
  }

  try {
    const insertedChat = await insertChatDb({
      ...data,
      friendRequestId: existingFriendRequest.id,
    });
    if (!insertedChat) {
      throw new Error("Failed to create chat.");
    }

    return {
      error: false,
      message: "Chat created successfully!",
      chatId: insertedChat.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateFriendChatAction = async (
  chatId: string,
  unsafeData: FriendChatSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = friendChatSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, data.friendRequestId),
        or(
          eq(FriendRequestTable.fromUserId, userId),
          eq(FriendRequestTable.toUserId, userId),
        ),
      ),
    );
  if (!existingFriendRequest) {
    return {
      error: true,
      message: "You are not friends with this user.",
    };
  }

  try {
    const updatedChat = await updateChatDb(chatId, data);
    if (!updatedChat) {
      throw new Error("Failed to update chat.");
    }

    return {
      error: false,
      message: "Chat updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const createFriendChatMessageAction = async (
  friendRequestId: string,
  chatId: string,
  unsafeData: ChatInputSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingFriendRequest] = await db
    .select()
    .from(FriendRequestTable)
    .where(
      and(
        eq(FriendRequestTable.id, friendRequestId),
        or(
          eq(FriendRequestTable.fromUserId, userId),
          eq(FriendRequestTable.toUserId, userId),
        ),
      ),
    );
  if (!existingFriendRequest) {
    return {
      error: true,
      message: "You are not friends with this user.",
    };
  }

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(
      and(
        eq(ChatTable.id, chatId),
        eq(ChatTable.friendRequestId, existingFriendRequest.id),
      ),
    );
  if (!existingChat) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { data, success } = chatInputSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const insertedChatMessage = await insertChatMessage({
      userId,
      chatId: existingChat.id,
      text: data.text,
    });

    if (!insertedChatMessage) {
      throw new Error("Failed to insert chat message.");
    }

    return {
      error: false,
      message: "Chat message created successfully!",
      chatMessage: insertedChatMessage,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
