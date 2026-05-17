import { db } from "@/db/db";
import { ChatTable } from "@/db/schema";

export const insertChat = async (data: typeof ChatTable.$inferInsert) => {
  const [insertedChat] = await db.insert(ChatTable).values(data).returning();

  return insertedChat;
};
