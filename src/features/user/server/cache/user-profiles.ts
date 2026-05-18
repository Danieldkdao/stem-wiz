import { getUserIdTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserProfileTag = (userId: string) => {
  return getUserIdTag(userId, "user_profiles");
};

export const revalidateUserProfileCache = (userId: string) => {
  revalidateTag(getUserProfileTag(userId), { expire: 0 });
};
