import { getUserIdResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserProfileTag = (userId: string) => {
  return getUserIdResourceTag(userId, "user_profiles");
};

export const revalidateUserProfileCache = (userId: string) => {
  revalidateTag(getUserProfileTag(userId), { expire: 0 });
};
