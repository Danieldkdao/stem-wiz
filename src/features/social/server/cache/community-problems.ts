import { getGlobalTag, getIdTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getCommunityProblemGlobalTag = () => {
  return getGlobalTag("community_problems");
};

export const getCommunityProblemIdTag = (problemId: string) => {
  return getIdTag(problemId, "community_problems");
};

export const revalidateCommunityProblemCache = (problemId: string) => {
  revalidateTag(getCommunityProblemGlobalTag(), { expire: 0 });
  revalidateTag(getCommunityProblemIdTag(problemId), { expire: 0 });
};
