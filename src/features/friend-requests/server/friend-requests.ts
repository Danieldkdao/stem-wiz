import { db } from "@/db/db";
import { FriendRequestTable } from "@/db/schema";

export const insertFriendRequest = async (
  friendRequest: typeof FriendRequestTable.$inferInsert,
) => {
  const [insertedFriendRequest] = await db
    .insert(FriendRequestTable)
    .values(friendRequest)
    .returning();

  return insertedFriendRequest;
};
