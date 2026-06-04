import { getIdTag, getUserIdResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getOracleSessionUserTag = (userId: string) => {
  return getUserIdResourceTag(userId, "oracle_sessions");
};

export const getOracleSessionIdTag = (sessionId: string) => {
  return getIdTag(sessionId, "oracle_sessions");
};

export const revalidateOracleSessionCache = (
  userId: string,
  sessionId: string,
) => {
  revalidateTag(getOracleSessionUserTag(userId), { expire: 0 });
  revalidateTag(getOracleSessionIdTag(sessionId), { expire: 0 });
};
