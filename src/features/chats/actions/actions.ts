"use server";

import { db } from "@/db/db";
import { ChatTable } from "@/db/schema";
import {
  confirmExistingMatch,
  isUserMatchActive,
} from "@/features/matches/actions/actions";
import { auth } from "@/lib/auth/auth";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { insertChatMessage } from "../server/chat-messages";
import { insertChat } from "../server/chats";
import { chatInputSchema, ChatInputSchemaType } from "./schemas";

export const createMatchChatMessageAction = async (
  matchId: string,
  unsafeData: ChatInputSchemaType,
) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
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
    const insertedChat = await insertChat({ matchId: existingMatch.id });
    existingChatId = insertedChat.id;
  }

  try {
    const insertedChatMessage = await insertChatMessage({
      userId: session.user.id,
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
