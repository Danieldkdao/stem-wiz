import { db, DbTransaction } from "@/db/db";
import { ChatMessageTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const insertChatMessageDb = async (
  chat: typeof ChatMessageTable.$inferInsert,
) => {
  const [insertedChatMessage] = await db
    .insert(ChatMessageTable)
    .values(chat)
    .returning();

  return insertedChatMessage;
};

export const updateChatMessageDb = async (
  chatId: string,
  messageId: string,
  chatData: Partial<typeof ChatMessageTable.$inferSelect>,
) => {
  const [updatedChatMessage] = await db
    .update(ChatMessageTable)
    .set(chatData)
    .where(
      and(
        eq(ChatMessageTable.chatId, chatId),
        eq(ChatMessageTable.id, messageId),
      ),
    )
    .returning();

  return updatedChatMessage;
};

export const deleteChatMessageDb = async (
  chatId: string,
  messageId: string,
) => {
  const [deletedChatMessage] = await db
    .update(ChatMessageTable)
    .set({
      status: "deleted",
      respondedAt: new Date(),
    })
    .where(
      and(
        eq(ChatMessageTable.id, messageId),
        eq(ChatMessageTable.chatId, chatId),
      ),
    )
    .returning();

  return deletedChatMessage;
};
