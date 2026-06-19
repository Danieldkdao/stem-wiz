import { getGlobalTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getCommunityProblemGlobalTag = () => {
  return getGlobalTag("community_problems");
};

export const revalidateCommunityProblemCache = () => {
  revalidateTag(getCommunityProblemGlobalTag(), { expire: 0 });
};
