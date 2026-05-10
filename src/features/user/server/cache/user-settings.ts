import { getUserIdTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserSettingsTag = (userId: string) => {
  return getUserIdTag(userId, "user_settings");
};

export const revalidateUserSettingsCache = (userId: string) => {
  revalidateTag(getUserSettingsTag(userId), { expire: 0 });
};
