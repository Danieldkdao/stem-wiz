"use server";

import { db } from "@/db/db";
import {
  ChatMessageTable,
  ChatTable,
  FriendshipTable,
  user,
} from "@/db/schema";
import { findActiveFriendshipById } from "@/features/friends/server/friendships";
import {
  checkExistingParticipant,
  confirmExistingMatch,
} from "@/features/matches/actions/actions";
import { insertNotificationDb } from "@/features/notifications/server/notifications-db";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { areValidIds } from "@/lib/utils";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import {
  FriendChatsFilterByOptionType,
  FriendChatsSortByOptionType,
} from "../lib/friend-chat-params";
import {
  deleteChatMessageDb,
  insertChatMessageDb,
  updateChatMessageDb,
} from "../server/chat-messages";
import { deleteChatDb, insertChatDb, updateChatDb } from "../server/chats";
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
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
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

  const userMatch = await checkExistingParticipant(existingMatch.id);
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
    const insertedChatMessage = await insertChatMessageDb({
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
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
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

  const existingFriendship = await findActiveFriendshipById(
    data.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    return {
      error: true,
      message: "Invalid friend selection",
    };
  }

  try {
    const { insertedChatId, notificationId } = await db.transaction(
      async (tx) => {
        const insertedChat = await insertChatDb(
          {
            ...data,
            friendshipId: existingFriendship.id,
          },
          tx,
        );
        if (!insertedChat) {
          throw new Error("Failed to create chat.");
        }

        const insertedNotification = await insertNotificationDb(
          {
            userId: existingFriendship.friend.id,
            payload: {
              type: "new_chat",
              chatId: insertedChat.id,
              userId,
              title: `New Chat`,
              message: `${userInfo.name} created a new chat and invited you.`,
            },
          },
          tx,
        );
        if (!insertedNotification) {
          throw new Error("Failed to create notification.");
        }

        return {
          insertedChatId: insertedChat.id,
          notificationId: insertedNotification.id,
        };
      },
    );

    return {
      error: false,
      message: "Chat created successfully!",
      chatId: insertedChatId,
      notificationId,
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
  if (!areValidIds([chatId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
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

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat || existingChat.friendshipId !== data.friendshipId) {
    return {
      error: true,
      message: "Chat not found.",
    };
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) {
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
      chatId: updatedChat.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getFriendChatsAction = async (filterOptions: {
  search: string;
  sortBy: FriendChatsSortByOptionType;
  filterBy: FriendChatsFilterByOptionType;
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const friendships = await db.query.FriendshipTable.findMany({
    where: and(
      isNull(FriendshipTable.deletedAt),
      or(
        eq(FriendshipTable.userOneId, userId),
        eq(FriendshipTable.userTwoId, userId),
      ),
    ),
  });

  const { search, sortBy, filterBy, page } = filterOptions;
  const offset = (page - 1) * PAGE_SIZE;

  const messageCount = sql<number>`(
        SELECT COUNT(*)
        FROM ${ChatMessageTable} cmt
        WHERE cmt.chat_id = ${ChatTable.id}
      )`;

  const latestActivityAt = sql`
    COALESCE(
      (
        SELECT MAX(${ChatMessageTable.createdAt})
        FROM ${ChatMessageTable}
        WHERE ${ChatMessageTable.chatId} = ${ChatTable.id}
      ),
      ${ChatTable.createdAt}
    )
  `;

  const sortByMap: Record<FriendChatsSortByOptionType, SQL<unknown>> = {
    most_recent: desc(ChatTable.createdAt),
    oldest: asc(ChatTable.createdAt),
    most_recent_activity: desc(latestActivityAt),
    oldest_activity: asc(latestActivityAt),
    friend_name: asc(user.name),
    most_messages: desc(messageCount),
  };

  const filterByMap: Record<
    FriendChatsFilterByOptionType,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    empty: sql`${messageCount} = 0`,
    has_messages: sql`${messageCount} > 0`,
  };

  const searchQuery = search.trim()
    ? or(
        ilike(user.name, `%${search.trim()}%`),
        ilike(ChatTable.title, `%${search.trim()}%`),
        exists(
          db
            .select()
            .from(ChatMessageTable)
            .where(
              and(
                eq(ChatMessageTable.chatId, ChatTable.id),
                ilike(ChatMessageTable.text, `%${search.trim()}%`),
              ),
            ),
        ),
      )
    : undefined;

  const whereQuery = and(
    inArray(
      ChatTable.friendshipId,
      friendships.map((f) => f.id),
    ),
    filterByMap[filterBy],
    searchQuery,
  );

  const chats = await db
    .select({
      ...getTableColumns(ChatTable),
      user: getTableColumns(user),
      messageCount,
    })
    .from(ChatTable)
    .innerJoin(FriendshipTable, eq(ChatTable.friendshipId, FriendshipTable.id))
    .innerJoin(
      user,
      or(
        and(
          eq(FriendshipTable.userOneId, userId),
          eq(FriendshipTable.userTwoId, user.id),
        ),
        and(
          eq(FriendshipTable.userTwoId, userId),
          eq(FriendshipTable.userOneId, user.id),
        ),
      ),
    )
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalFriendChats] = await db
    .select({
      count: count(),
    })
    .from(ChatTable)
    .innerJoin(FriendshipTable, eq(ChatTable.friendshipId, FriendshipTable.id))
    .innerJoin(
      user,
      or(
        and(
          eq(FriendshipTable.userOneId, userId),
          eq(FriendshipTable.userTwoId, user.id),
        ),
        and(
          eq(FriendshipTable.userTwoId, userId),
          eq(FriendshipTable.userOneId, user.id),
        ),
      ),
    )
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalFriendChats.count;

  return {
    chats,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const getFriendChatAction = async (chatId: string) => {
  if (!areValidIds([chatId])) return null;
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));

  if (!existingChat || !existingChat.friendshipId) return null;

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) return null;

  return {
    chat: existingChat,
    friendship: existingFriendship,
  };
};

export const getFriendChatMessagesAction = async (
  chatId: string,
  page: number,
) => {
  if (!areValidIds([chatId])) return null;
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));

  if (!existingChat || !existingChat.friendshipId) return null;

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) return;

  const offset = (page - 1) * PAGE_SIZE;

  const chatMessages = await db
    .select({
      ...getTableColumns(ChatMessageTable),
      user: getTableColumns(user),
    })
    .from(ChatMessageTable)
    .innerJoin(user, eq(user.id, ChatMessageTable.userId))
    .where(
      and(
        eq(ChatMessageTable.chatId, existingChat.id),
        eq(ChatMessageTable.role, "user"),
        isNotNull(ChatMessageTable.userId),
      ),
    )
    .orderBy(desc(ChatMessageTable.createdAt))
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalMessages] = await db
    .select({
      count: count(),
    })
    .from(ChatMessageTable)
    .innerJoin(user, eq(user.id, ChatMessageTable.userId))
    .where(
      and(
        eq(ChatMessageTable.chatId, existingChat.id),
        eq(ChatMessageTable.role, "user"),
        isNotNull(ChatMessageTable.userId),
      ),
    );

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalMessages.count;

  return {
    chatMessages: chatMessages.reverse(),
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const sendFriendChatMessageAction = async (
  chatId: string,
  unsafeData: ChatInputSchemaType,
) => {
  if (!areValidIds([chatId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat || !existingChat.friendshipId) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    return {
      error: true,
      message: "You are not friends with this user.",
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
    const insertedChatMessage = await insertChatMessageDb({
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

export const updateFriendChatMessageAction = async (
  chatId: string,
  messageId: string,
  unsafeData: ChatInputSchemaType,
) => {
  if (!areValidIds([chatId, messageId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat || !existingChat.friendshipId) {
    return {
      error: true,
      message: "Chat not found.",
    };
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  const [existingChatMessage] = await db
    .select()
    .from(ChatMessageTable)
    .where(
      and(
        eq(ChatMessageTable.userId, userId),
        eq(ChatMessageTable.id, messageId),
        eq(ChatMessageTable.chatId, existingChat.id),
      ),
    );
  if (!existingChatMessage) {
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
    const updatedMessage = await updateChatMessageDb(
      existingChat.id,
      existingChatMessage.id,
      { ...data, status: "updated", respondedAt: new Date() },
    );
    if (!updatedMessage) {
      throw new Error("Failed to update chat message.");
    }

    return {
      error: false,
      message: "Chat message updated successfully!",
      chatMessage: updatedMessage,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteFriendChatMessageAction = async (
  chatId: string,
  messageId: string,
) => {
  if (!areValidIds([chatId, messageId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat || !existingChat.friendshipId) {
    return {
      error: true,
      message: "Chat not found.",
    };
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  const [existingChatMessage] = await db
    .select()
    .from(ChatMessageTable)
    .where(
      and(
        eq(ChatMessageTable.userId, userId),
        eq(ChatMessageTable.id, messageId),
        eq(ChatMessageTable.chatId, existingChat.id),
      ),
    );
  if (!existingChatMessage) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedChatMessage = await deleteChatMessageDb(
      existingChat.id,
      existingChatMessage.id,
    );
    if (!deletedChatMessage) {
      throw new Error("Failed to delete chat message.");
    }

    return {
      error: false,
      message: "Chat message deleted successfully!",
      chatMessage: deletedChatMessage,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteFriendChatAction = async (chatId: string) => {
  if (!areValidIds([chatId])) {
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

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.id, chatId));
  if (!existingChat || !existingChat.friendshipId) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const existingFriendship = await findActiveFriendshipById(
    existingChat.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  try {
    const { deletedChat, notificationId } = await db.transaction(async (tx) => {
      const deletedChat = await deleteChatDb(existingChat.id, tx);
      if (!deletedChat) {
        throw new Error("Failed to delete chat.");
      }

      const insertedNotification = await insertNotificationDb(
        {
          userId: existingFriendship.friend.id,
          payload: {
            type: "chat_deleted",
            chatId: deletedChat.id,
            userId: existingFriendship.friend.id,
            title: "Chat Deleted",
            message: `${userInfo.name} deleted the following chat: "${deletedChat.title}".`,
          },
        },
        tx,
      );
      if (!insertedNotification) {
        throw new Error("Failed to created notification.");
      }

      return { deletedChat, notificationId: insertedNotification.id };
    });

    return {
      error: false,
      message: "Chat deleted successfully!",
      chat: deletedChat,
      notificationId,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getMatchChatMessagesAction = async (
  matchId: string,
  page: number,
) => {
  if (!areValidIds([matchId])) return null;
  const offset = (page - 1) * PAGE_SIZE;

  const chatMessages = await db
    .select({
      ...getTableColumns(ChatMessageTable),
      user: getTableColumns(user),
    })
    .from(ChatMessageTable)
    .innerJoin(ChatTable, eq(ChatTable.id, ChatMessageTable.chatId))
    .innerJoin(user, eq(user.id, ChatMessageTable.userId))
    .where(eq(ChatTable.matchId, matchId))
    .orderBy(desc(ChatMessageTable.createdAt))
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalChatMessages] = await db
    .select({
      count: count(),
    })
    .from(ChatMessageTable)
    .innerJoin(ChatTable, eq(ChatTable.id, ChatMessageTable.chatId))
    .innerJoin(user, eq(user.id, ChatMessageTable.userId))
    .where(eq(ChatTable.matchId, matchId));

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalChatMessages.count;

  return {
    chatMessages: chatMessages.reverse(),
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};
