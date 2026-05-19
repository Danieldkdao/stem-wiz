import { getGlobalTag, getIdTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserGlobalTag = () => {
  return getGlobalTag("user");
};

export const getUserIdTag = (userId: string) => {
  return getIdTag(userId, "user");
};

export const revalidateUserCache = (userId: string) => {
  revalidateTag(getUserGlobalTag(), { expire: 0 });
  revalidateTag(getUserIdTag(userId), { expire: 0 });
};
