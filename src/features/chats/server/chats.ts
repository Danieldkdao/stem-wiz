import { db, DbTransaction } from "@/db/db";
import { ChatTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const insertChatDb = async (
  data: typeof ChatTable.$inferInsert,
  tx?: DbTransaction,
) => {
  const [insertedChat] = await (tx ?? db)
    .insert(ChatTable)
    .values(data)
    .returning();

  return insertedChat;
};

export const updateChatDb = async (
  chatId: string,
  data: Partial<typeof ChatTable.$inferSelect>,
) => {
  const [updatedChat] = await db
    .update(ChatTable)
    .set(data)
    .where(eq(ChatTable.id, chatId))
    .returning();

  return updatedChat;
};

export const deleteChatDb = async (chatId: string, tx?: DbTransaction) => {
  const [deletedChat] = await (tx ?? db)
    .delete(ChatTable)
    .where(eq(ChatTable.id, chatId))
    .returning();

  return deletedChat;
};
