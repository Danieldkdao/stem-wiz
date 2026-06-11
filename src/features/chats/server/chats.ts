import { db } from "@/db/db";
import { ChatTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const insertChatDb = async (data: typeof ChatTable.$inferInsert) => {
  const [insertedChat] = await db.insert(ChatTable).values(data).returning();

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

export const deleteChatDb = async (chatId: string) => {
  const [deletedChat] = await db
    .delete(ChatTable)
    .where(eq(ChatTable.id, chatId))
    .returning();

  return deletedChat;
};
