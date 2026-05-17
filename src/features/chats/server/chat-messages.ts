import { db } from "@/db/db";
import { ChatMessageTable } from "@/db/schema";

export const insertChatMessage = async (
  chat: typeof ChatMessageTable.$inferInsert,
) => {
  const [insertedChatMessage] = await db
    .insert(ChatMessageTable)
    .values(chat)
    .returning();

  return insertedChatMessage;
};
