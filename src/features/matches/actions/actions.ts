"use server";

import { db } from "@/db/db";
import {
  ArenaProblemConfigTable,
  CommunityProblemTable,
  FriendMatchRequestStatusType,
  FriendMatchRequestTable,
  FriendshipTable,
  MatchObserverInvitationStatusType,
  MatchObserverInvitationTable,
  MatchObserverTable,
  MatchResultReasonType,
  MatchResultTable,
  MatchSubmissionTable,
  MatchTable,
  ProblemTable,
  ProgrammingLanguageType,
  user,
  UserMatchTable,
} from "@/db/schema";
import { finalizeMatch } from "@/features/arena/server/finalize-match";
import { findActiveFriendshipById } from "@/features/friends/server/friendships";
import { insertNotificationDb } from "@/features/notifications/server/notifications-db";
import { User } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { SortByType } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { generateMatchResults } from "@/services/ai/matches";
import { aiGenerateProblem } from "@/services/ai/problems";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  not,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { mapProblemToArenaProblem } from "../lib/formatters";
import { MatchRequestFilterByOptionType } from "../lib/match-request-params";
import {
  UserMatchesFilterByOptionType,
  UserMatchesKindOptionType,
  UserMatchesResultOptionType,
  UserMatchesSortByOptionType,
} from "../lib/params";
import { updateMatchRequestDb } from "../server/match-requests";
import { upsertMatchSubmission } from "../server/match-results";
import {
  friendMatchRequestSchema,
  FriendMatchRequestSchemaType,
  matchObserverInvitationSchema,
  MatchObserverInvitationSchemaType,
} from "./schemas";

const hasMatchFinished = async (matchId: string) => {
  if (!areValidIds([matchId])) return false;
  const [match] = await db
    .select({ status: MatchTable.status })
    .from(MatchTable)
    .where(eq(MatchTable.id, matchId))
    .limit(1);

  return match?.status === "finished";
};

const activeMatchExpirationQuery = () =>
  or(isNull(MatchTable.expiresAt), gt(MatchTable.expiresAt, new Date()));

const finalizeMatchIfAllUsersSubmitted = async (matchId: string) => {
  if (!areValidIds([matchId])) return { finished: false, error: true };
  const latestMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      activeMatchExpirationQuery(),
    ),
    with: {
      users: true,
      submissions: true,
    },
  });

  if (!latestMatch) {
    return { finished: await hasMatchFinished(matchId), error: false };
  }

  const submittedUserIds = new Set(
    latestMatch.submissions.map((submission) => submission.userId),
  );
  const allUsersSubmitted = latestMatch.users.every((user) =>
    submittedUserIds.has(user.userId),
  );

  if (!allUsersSubmitted) {
    return { finished: false, error: false };
  }

  const winnerId = await generateMatchResults(latestMatch.id);

  if (!winnerId) {
    return { finished: false, error: true };
  }

  const finalizedMatch = await finalizeMatch({
    matchId: latestMatch.id,
    reason: "traditional",
    winnerId: winnerId === "none" ? null : winnerId,
  });

  if (!finalizedMatch) {
    return {
      finished: await hasMatchFinished(latestMatch.id),
      error: false,
    };
  }

  return { finished: true, error: false };
};

export const confirmExistingMatch = async (matchId: string) => {
  if (!areValidIds([matchId])) return null;
  const [existingMatch] = await db
    .select()
    .from(MatchTable)
    .where(
      and(
        eq(MatchTable.id, matchId),
        eq(MatchTable.status, "in-progress"),
        activeMatchExpirationQuery(),
      ),
    );

  return existingMatch;
};

export const checkExistingMatchAction = async ({
  id,
  forResults = false,
}: {
  id: string;
  forResults?: boolean;
}) => {
  if (!areValidIds([id])) return null;
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, id),
      forResults ? undefined : activeMatchExpirationQuery(),
    ),
    with: {
      submissions: true,
      arenaProblem: {
        with: {
          problem: true,
        },
      },
      users: {
        with: {
          user: true,
        },
        orderBy: desc(UserMatchTable.userId),
      },
      matchObserverInvitations: true,
      matchObservers: true,
      result: true,
    },
  });

  if (!existingMatch) return null;
  return existingMatch ?? null;
};

export const timeoutExpiredMatch = async (matchId: string) => {
  if (!areValidIds([matchId])) return null;
  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
    with: {
      users: {
        with: {
          user: true,
        },
      },
      arenaProblem: {
        with: {
          problem: true,
        },
      },
      submissions: true,
      result: true,
    },
  });

  if (!existingMatch) return null;
  if (
    existingMatch.status === "finished" ||
    (existingMatch.users.length !== existingMatch.submissions.length &&
      (existingMatch.expiresAt === null ||
        existingMatch.expiresAt > new Date()) &&
      existingMatch.status === "in-progress")
  )
    return existingMatch;

  if (existingMatch.expiresAt === null) return existingMatch;

  let winnerId: string | null = null;
  if (existingMatch.submissions.length > 0) {
    const generatedWinnerId = await generateMatchResults(matchId);
    winnerId = generatedWinnerId === "none" ? null : generatedWinnerId;
  }

  await finalizeMatch({
    matchId: existingMatch.id,
    reason: "timeout",
    winnerId,
  });

  return db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
    with: {
      users: {
        with: {
          user: true,
        },
      },
      arenaProblem: {
        with: {
          problem: true,
        },
      },
      submissions: true,
      result: true,
    },
  });
};

export const quitMatchAction = async (matchId: string) => {
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
    with: {
      users: true,
    },
  });

  if (!existingMatch) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const isMatchUser = existingMatch.users.some(
    (user) => user.userId === userId,
  );
  if (!isMatchUser) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  if (
    existingMatch.status === "finished" ||
    (existingMatch.expiresAt !== null && existingMatch.expiresAt <= new Date())
  ) {
    return {
      error: false,
      message: "This match has already ended.",
    };
  }

  const opponent = existingMatch.users.find((user) => user.userId !== userId);
  if (!opponent) {
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  try {
    const finalizedMatch = await finalizeMatch({
      matchId: existingMatch.id,
      reason: "user_quit",
      winnerId: opponent.userId,
    });

    if (!finalizedMatch) {
      if (await hasMatchFinished(existingMatch.id)) {
        return {
          error: false,
          message: "This match has already ended.",
        };
      }

      throw new Error("Failed to quit match.");
    }

    return {
      error: false,
      message: "Match quit successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const handleMatchTimeoutAction = async (matchId: string) => {
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
    with: {
      users: true,
    },
  });

  if (
    !existingMatch ||
    !existingMatch.users.find((user) => user.userId === userId)
  ) {
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  if (existingMatch.status === "finished") {
    return {
      error: false,
      message: "This match has already ended.",
    };
  }

  if (existingMatch.expiresAt === null) {
    return {
      error: true,
      message: "This match does not have a time limit.",
    };
  }

  if (existingMatch.expiresAt > new Date()) {
    return {
      error: true,
      message: "This match is still in progress.",
    };
  }

  const [existingSubmission] = await db
    .select()
    .from(MatchSubmissionTable)
    .where(eq(MatchSubmissionTable.matchId, existingMatch.id));

  let winnerId = null;
  if (existingSubmission) {
    const winnerIdResponse = await generateMatchResults(existingMatch.id);
    winnerId = winnerIdResponse === "none" ? null : winnerIdResponse;
  }

  try {
    const finalizedMatch = await finalizeMatch({
      matchId: existingMatch.id,
      reason: "timeout",
      winnerId,
    });

    if (!finalizedMatch) {
      if (await hasMatchFinished(existingMatch.id)) {
        return {
          error: false,
          message: "This match has already ended.",
        };
      }

      throw new Error("Failed to timeout match.");
    }

    return {
      error: false,
      message: "Match timed out.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const handleUserMatchWinAction = async (matchId: string) => {
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingMatch = await db.query.MatchTable.findFirst({
    where: eq(MatchTable.id, matchId),
    with: {
      users: true,
    },
  });

  if (!existingMatch) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const isMatchUser = existingMatch.users.some(
    (user) => user.userId === userId,
  );
  if (!isMatchUser) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  if (
    existingMatch.status === "finished" ||
    (existingMatch.expiresAt !== null && existingMatch.expiresAt <= new Date())
  ) {
    return {
      error: false,
      message: "This match has already ended.",
    };
  }

  try {
    const finalizedMatch = await finalizeMatch({
      matchId: existingMatch.id,
      reason: "user_lost_connection",
      winnerId: userId,
    });

    if (!finalizedMatch) {
      if (await hasMatchFinished(existingMatch.id)) {
        return {
          error: false,
          message: "This match has already ended.",
        };
      }

      throw new Error("Something went wrong.");
    }

    return {
      error: false,
      message: "You have won the match!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const codeSubmissionAction = async (matchId: string, code: string) => {
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingMatchUser] = await db
    .select({
      ...getTableColumns(UserMatchTable),
    })
    .from(UserMatchTable)
    .innerJoin(MatchTable, eq(MatchTable.id, UserMatchTable.matchId))
    .where(
      and(
        eq(UserMatchTable.userId, userId),
        eq(UserMatchTable.matchId, matchId),
        eq(MatchTable.status, "in-progress"),
        activeMatchExpirationQuery(),
      ),
    );

  if (!existingMatchUser) {
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  try {
    const matchSubmission = await upsertMatchSubmission({
      ...existingMatchUser,
      code,
    });
    if (!matchSubmission) {
      throw new Error("Failed to upsert match submission.");
    }

    const finalizedMatch = await finalizeMatchIfAllUsersSubmitted(matchId);

    if (finalizedMatch.error) {
      return {
        error: true,
        message: "Code submitted, but failed to finish the match.",
      };
    }

    return {
      error: false,
      message: finalizedMatch.finished
        ? "Code submitted and match finished successfully!"
        : "Code submitted successfully!",
      matchFinished: finalizedMatch.finished,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const checkExistingParticipant = async (matchId: string) => {
  if (!areValidIds([matchId])) return null;
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const userMatch = await db.query.UserMatchTable.findFirst({
    where: and(
      eq(UserMatchTable.userId, userId),
      eq(UserMatchTable.matchId, matchId),
    ),
    with: {
      match: true,
    },
  });

  return userMatch ?? null;
};

export const getObservableMatchesAction = async (filterOptions: {
  search: string;
  sortBy: UserMatchesSortByOptionType;
  languages: ProgrammingLanguageType[];
  kind: UserMatchesKindOptionType;
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { search, sortBy, languages, kind, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const sortByMap: Record<UserMatchesSortByOptionType, SQL<unknown>> = {
    most_recent: desc(MatchTable.createdAt),
    oldest: asc(MatchTable.createdAt),
    expires_soon: sql`${MatchTable.expiresAt} asc nulls last`,
  };

  const kindMap: Record<UserMatchesKindOptionType, SQL<unknown> | undefined> = {
    all: undefined,
    arena: eq(MatchTable.kind, "arena"),
    friend_challenge: eq(MatchTable.kind, "friend_challenge"),
  };

  const searchQuery = search.trim()
    ? exists(
        db
          .select()
          .from(UserMatchTable)
          .innerJoin(user, eq(user.id, UserMatchTable.userId))
          .where(
            and(
              eq(UserMatchTable.matchId, MatchTable.id),
              ilike(user.name, `%${search.trim()}%`),
            ),
          ),
      )
    : undefined;

  const whereQuery = and(
    eq(MatchTable.status, "in-progress"),
    kindMap[kind],
    or(
      eq(MatchTable.kind, "arena"),
      exists(
        db
          .select()
          .from(MatchObserverTable)
          .where(
            and(
              eq(MatchObserverTable.matchId, MatchTable.id),
              eq(MatchObserverTable.userId, userId),
            ),
          ),
      ),
    ),
    not(
      exists(
        db
          .select()
          .from(UserMatchTable)
          .where(
            and(
              eq(UserMatchTable.matchId, MatchTable.id),
              eq(UserMatchTable.userId, userId),
            ),
          ),
      ),
    ),
    activeMatchExpirationQuery(),
    languages.length
      ? inArray(ProblemTable.programmingLanguage, languages)
      : undefined,
    searchQuery,
  );

  const matches = await db
    .select({
      ...getTableColumns(MatchTable),
      arenaProblem: getTableColumns(ArenaProblemConfigTable),
      problem: getTableColumns(ProblemTable),

      users: sql<(typeof UserMatchTable.$inferSelect & { user: User })[]>`(
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'userId', umt.user_id,
                'matchId', umt.match_id,
                'code', umt.code,
                'user', to_jsonb(ut)
              )
            )
            FROM ${UserMatchTable} umt
            JOIN ${user} AS ut ON ut.id = umt.user_id
            WHERE umt.match_id = ${MatchTable.id}
          ),
          '[]'::jsonb
        )
      )`,
    })
    .from(MatchTable)
    .innerJoin(
      ArenaProblemConfigTable,
      eq(ArenaProblemConfigTable.id, MatchTable.problemId),
    )
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, ArenaProblemConfigTable.problemId),
    )
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalMatches] = await db
    .select({
      count: count(),
    })
    .from(MatchTable)
    .innerJoin(
      ArenaProblemConfigTable,
      eq(ArenaProblemConfigTable.id, MatchTable.problemId),
    )
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, ArenaProblemConfigTable.problemId),
    )
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalMatches.count;

  return {
    matches: matches.map((match) =>
      mapProblemToArenaProblem<typeof match>(match),
    ),
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const getUserMatchesAction = async (filterOptions: {
  search: string;
  sortBy: UserMatchesSortByOptionType;
  filterBy: UserMatchesFilterByOptionType;
  results: UserMatchesResultOptionType[];
  completionReasons: MatchResultReasonType[];
  kind: UserMatchesKindOptionType;
  page: number;
  limit?: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const {
    search,
    sortBy,
    filterBy,
    results,
    completionReasons,
    kind,
    page,
    limit,
  } = filterOptions;

  const pageSize = limit || PAGE_SIZE;

  const offset = (page - 1) * pageSize;

  const currentUserMatch = alias(UserMatchTable, "current_user_match");
  const opponentUserMatch = alias(UserMatchTable, "opponent_user_match");

  const sortByMap: Record<UserMatchesSortByOptionType, SQL<unknown>> = {
    most_recent: desc(MatchTable.createdAt),
    oldest: asc(MatchTable.createdAt),
    expires_soon: sql`${MatchTable.expiresAt} asc nulls last`,
  };

  const filterByMap: Record<
    UserMatchesFilterByOptionType,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    completed: isNotNull(MatchResultTable.matchId),
    in_progress: isNull(MatchResultTable.matchId),
  };

  const resultsMap: Record<
    UserMatchesResultOptionType,
    SQL<unknown> | undefined
  > = {
    won: eq(MatchResultTable.winnerId, userId),
    lost: and(
      isNotNull(MatchResultTable.winnerId),
      not(eq(MatchResultTable.winnerId, userId)),
    ),
    no_winner: eq(MatchResultTable.result, "tie"),
  };

  const kindMap: Record<UserMatchesKindOptionType, SQL<unknown> | undefined> = {
    all: undefined,
    arena: eq(MatchTable.kind, "arena"),
    friend_challenge: eq(MatchTable.kind, "friend_challenge"),
  };

  const resultsFilter = results.length
    ? or(...results.map((result) => resultsMap[result]))
    : undefined;
  const completionReasonsFilter = completionReasons.length
    ? inArray(MatchResultTable.reason, completionReasons)
    : undefined;

  const whereQuery = and(
    filterByMap[filterBy],
    resultsFilter,
    completionReasonsFilter,
    search.trim() ? ilike(user.name, `%${search.trim()}%`) : undefined,
    kindMap[kind],
  );

  const matches = await db
    .select({
      ...getTableColumns(MatchTable),
      result: getTableColumns(MatchResultTable),
      opponent: getTableColumns(user),
      arenaProblem: getTableColumns(ArenaProblemConfigTable),
      problem: getTableColumns(ProblemTable),
    })
    .from(MatchTable)
    .leftJoin(MatchResultTable, eq(MatchResultTable.matchId, MatchTable.id))
    .innerJoin(
      ArenaProblemConfigTable,
      eq(ArenaProblemConfigTable.id, MatchTable.problemId),
    )
    .innerJoin(
      ProblemTable,
      eq(ArenaProblemConfigTable.problemId, ProblemTable.id),
    )
    .innerJoin(
      currentUserMatch,
      and(
        eq(currentUserMatch.matchId, MatchTable.id),
        eq(currentUserMatch.userId, userId),
      ),
    )
    .innerJoin(
      opponentUserMatch,
      and(
        not(eq(opponentUserMatch.userId, userId)),
        eq(opponentUserMatch.matchId, MatchTable.id),
      ),
    )
    .innerJoin(user, eq(opponentUserMatch.userId, user.id))
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(pageSize);

  const [totalMatches] = await db
    .select({
      count: count(),
    })
    .from(MatchTable)
    .leftJoin(MatchResultTable, eq(MatchResultTable.matchId, MatchTable.id))
    .innerJoin(
      currentUserMatch,
      and(
        eq(currentUserMatch.matchId, MatchTable.id),
        eq(currentUserMatch.userId, userId),
      ),
    )
    .innerJoin(
      ArenaProblemConfigTable,
      eq(ArenaProblemConfigTable.id, MatchTable.problemId),
    )
    .innerJoin(
      ProblemTable,
      eq(ArenaProblemConfigTable.problemId, ProblemTable.id),
    )
    .innerJoin(
      opponentUserMatch,
      and(
        not(eq(opponentUserMatch.userId, userId)),
        eq(opponentUserMatch.matchId, MatchTable.id),
      ),
    )
    .innerJoin(user, eq(opponentUserMatch.userId, user.id))
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * pageSize < totalMatches.count;

  return {
    matches: matches.map((match) =>
      mapProblemToArenaProblem<typeof match>(match),
    ),
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const saveUserMatchCode = async (matchId: string, newCode: string) => {
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingParticipant = await checkExistingParticipant(matchId);
  if (!existingParticipant) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  try {
    await db
      .update(UserMatchTable)
      .set({
        code: newCode,
      })
      .where(
        and(
          eq(UserMatchTable.matchId, existingParticipant.matchId),
          eq(UserMatchTable.userId, userId),
        ),
      );

    return {
      error: false,
      message: "Code saved successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const createMatchRequestAction = async (
  unsafeData: FriendMatchRequestSchemaType,
) => {
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = friendMatchRequestSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const existingFriendship = await findActiveFriendshipById(
    data.recipientFriendshipId,
    userId,
  );
  if (!existingFriendship) {
    return {
      error: true,
      message: "You are not friends with this user.",
    };
  }

  let problemIdToUse: string | null = null;
  if (data.problemSource === "user") {
    if (!data.problemId) {
      return {
        error: true,
        message: "You must select a community problem.",
      };
    }

    const [existingCommunityProblem] = await db
      .select()
      .from(CommunityProblemTable)
      .where(eq(CommunityProblemTable.id, data.problemId));
    if (!existingCommunityProblem) {
      return {
        error: true,
        message: "Community problem not found.",
      };
    }

    problemIdToUse = existingCommunityProblem.problemId;
  } else {
    if (!data.programmingLanguage) {
      return {
        error: true,
        message: "You must select a programming language.",
      };
    }
    const generatedProblem = await aiGenerateProblem(
      data.programmingLanguage,
      existingFriendship.id,
      data.prompt,
    );
    if (!generatedProblem) {
      return {
        error: true,
        message: "Failed to generate problem for match. Please try again.",
      };
    }
    problemIdToUse = generatedProblem.id;
  }

  if (!problemIdToUse) {
    return {
      error: true,
      message: "Failed to load problem for match. Please try again.",
    };
  }

  try {
    const { matchRequest, notification } = await db.transaction(async (tx) => {
      const [insertedMatchRequest] = await tx
        .insert(FriendMatchRequestTable)
        .values({
          friendshipId: existingFriendship.id,
          recipientUserId: existingFriendship.friend.id,
          problemId: problemIdToUse,
          requesterUserId: userId,
          timeLimit: data.timeLimit,
          expiresAt: data.expiresAt,
        })
        .returning();
      if (!insertedMatchRequest) {
        throw new Error("Failed to create match request.");
      }

      const insertedNotification = await insertNotificationDb(
        {
          userId: existingFriendship.friend.id,
          payload: {
            type: "new_match_request",
            friendshipId: existingFriendship.id,
            matchRequestId: insertedMatchRequest.id,
            title: "New match request",
            message: `${userInfo.name} sent you a new match request.`,
          },
        },
        tx,
      );

      if (!insertedNotification)
        throw new Error("Failed to send notification.");

      return {
        matchRequest: insertedMatchRequest,
        notification: insertedNotification,
      };
    });

    return {
      error: false,
      message: "Match request sent successfully!",
      matchRequestId: matchRequest.id,
      notificationId: notification.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getUserMatchRequestsAction = async (filterOptions: {
  search: string;
  sortBy: SortByType;
  filterBy: MatchRequestFilterByOptionType;
  statuses: FriendMatchRequestStatusType[];
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { search, sortBy, filterBy, statuses, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const sortByMap: Record<SortByType, SQL<unknown>> = {
    most_recent: desc(FriendMatchRequestTable.createdAt),
    oldest: asc(FriendMatchRequestTable.createdAt),
  };

  const filterByMap: Record<
    MatchRequestFilterByOptionType,
    SQL<unknown> | undefined
  > = {
    all: or(
      eq(FriendMatchRequestTable.recipientUserId, userId),
      eq(FriendMatchRequestTable.requesterUserId, userId),
    ),
    received: eq(FriendMatchRequestTable.recipientUserId, userId),
    sent: eq(FriendMatchRequestTable.requesterUserId, userId),
  };

  const searchPattern = `%${search.trim()}%`;

  const problemConceptsSearch = sql`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(${ProblemTable.concepts}) AS concept(value)
        WHERE concept.value ILIKE ${searchPattern}
      )
    `;

  const searchQuery = search.trim()
    ? or(
        ilike(user.name, searchPattern),
        ilike(ProblemTable.title, searchPattern),
        ilike(ProblemTable.description, searchPattern),
        problemConceptsSearch,
      )
    : undefined;

  const whereQuery = and(
    filterByMap[filterBy],
    statuses.length
      ? inArray(FriendMatchRequestTable.status, statuses)
      : undefined,
    searchQuery,
  );

  const matchRequests = await db
    .select({
      ...getTableColumns(FriendMatchRequestTable),
      problem: getTableColumns(ProblemTable),
      friend: getTableColumns(user),
      match: getTableColumns(MatchTable),
      matchResult: getTableColumns(MatchResultTable),
      isSent: sql<boolean>`${FriendMatchRequestTable.requesterUserId} = ${userId}`,
    })
    .from(FriendMatchRequestTable)
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, FriendMatchRequestTable.problemId),
    )
    .innerJoin(
      FriendshipTable,
      eq(FriendshipTable.id, FriendMatchRequestTable.friendshipId),
    )
    .innerJoin(
      user,
      or(
        and(
          eq(FriendshipTable.userOneId, userId),
          eq(FriendshipTable.userTwoId, user.id),
        ),
        and(
          eq(FriendshipTable.userOneId, user.id),
          eq(FriendshipTable.userTwoId, userId),
        ),
      ),
    )
    .leftJoin(MatchTable, eq(MatchTable.id, FriendMatchRequestTable.matchId))
    .leftJoin(MatchResultTable, eq(MatchResultTable.matchId, MatchTable.id))
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalMatchRequests] = await db
    .select({
      count: count(),
    })
    .from(FriendMatchRequestTable)
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, FriendMatchRequestTable.problemId),
    )
    .innerJoin(
      FriendshipTable,
      eq(FriendshipTable.id, FriendMatchRequestTable.friendshipId),
    )
    .innerJoin(
      user,
      or(
        and(
          eq(FriendshipTable.userOneId, userId),
          eq(FriendshipTable.userTwoId, user.id),
        ),
        and(
          eq(FriendshipTable.userOneId, user.id),
          eq(FriendshipTable.userTwoId, userId),
        ),
      ),
    )
    .leftJoin(MatchTable, eq(MatchTable.id, FriendMatchRequestTable.matchId))
    .leftJoin(MatchResultTable, eq(MatchResultTable.matchId, MatchTable.id))
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalMatchRequests.count;

  return {
    matchRequests,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const updateMatchRequestStatusAction = async (
  matchRequestId: string,
  status: Extract<FriendMatchRequestStatusType, "cancelled" | "rejected">,
) => {
  if (!areValidIds([matchRequestId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const ownerStatusQueryMap: Record<
    Extract<FriendMatchRequestStatusType, "cancelled" | "rejected">,
    (SQL<unknown> | undefined)[]
  > = {
    // accepted: [
    //   eq(FriendMatchRequestTable.recipientUserId, userId),
    //   isNull(FriendMatchRequestTable.matchId),
    //   or(
    //     isNull(FriendMatchRequestTable.expiresAt),
    //     gt(FriendMatchRequestTable.expiresAt, new Date()),
    //   ),
    // ],
    cancelled: [
      eq(FriendMatchRequestTable.requesterUserId, userId),
      isNull(FriendMatchRequestTable.matchId),
      or(
        isNull(FriendMatchRequestTable.expiresAt),
        gt(FriendMatchRequestTable.expiresAt, new Date()),
      ),
    ],
    // expired: [
    //   or(
    //     eq(FriendMatchRequestTable.recipientUserId, userId),
    //     eq(FriendMatchRequestTable.requesterUserId, userId),
    //   ),
    //   isNull(FriendMatchRequestTable.matchId),
    //   and(
    //     isNotNull(FriendMatchRequestTable.expiresAt),
    //     lte(FriendMatchRequestTable.expiresAt, new Date()),
    //   ),
    // ],
    rejected: [
      eq(FriendMatchRequestTable.recipientUserId, userId),
      isNull(FriendMatchRequestTable.matchId),
      or(
        isNull(FriendMatchRequestTable.expiresAt),
        gt(FriendMatchRequestTable.expiresAt, new Date()),
      ),
    ],
  };

  const whereQuery = and(
    eq(FriendMatchRequestTable.id, matchRequestId),
    eq(FriendMatchRequestTable.status, "pending"),
    ...ownerStatusQueryMap[status],
  );

  const [existingMatchRequest] = await db
    .select({
      ...getTableColumns(FriendMatchRequestTable),
      problem: getTableColumns(ProblemTable),
    })
    .from(FriendMatchRequestTable)
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, FriendMatchRequestTable.problemId),
    )
    .where(whereQuery);
  if (!existingMatchRequest) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const existingFriendship = await findActiveFriendshipById(
    existingMatchRequest.friendshipId,
    userId,
  );
  if (!existingFriendship) {
    return {
      error: true,
      message: "Friendship not found.",
    };
  }

  try {
    // todo: add notifications
    const { updatedMatchRequest, notificationId } = await db.transaction(
      async (tx) => {
        const updatedMatchRequest = await updateMatchRequestDb(
          existingMatchRequest.id,
          { status, respondedAt: new Date() },
          tx,
        );
        if (!updatedMatchRequest)
          throw new Error("Failed to update match request.");

        const createdNotification = await insertNotificationDb(
          {
            userId: existingFriendship.friend.id,
            payload: {
              type: `match_request_${status}` as const,
              matchRequestId: updatedMatchRequest.id,
              friendshipId: updatedMatchRequest.friendshipId,
              title: `Match request ${status}`,
              message: `${userInfo.name} ${status} ${status === "cancelled" ? "their" : status === "rejected" ? "your" : "the"} match request "${existingMatchRequest.problem.title}".`,
            },
          },
          tx,
        );
        if (!createdNotification)
          throw new Error("Failed to create notification.");

        return {
          updatedMatchRequest,
          notificationId: createdNotification.id,
        };
      },
    );

    return {
      error: false,
      message: `Match request ${status} successfully!`,
      matchRequestId: updatedMatchRequest.id,
      notificationId,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteMatchRequestAction = async (matchRequestId: string) => {
  if (!areValidIds([matchRequestId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingMatchRequest] = await db
    .select()
    .from(FriendMatchRequestTable)
    .where(
      and(
        eq(FriendMatchRequestTable.id, matchRequestId),
        or(
          and(
            or(
              eq(FriendMatchRequestTable.status, "cancelled"),
              eq(FriendMatchRequestTable.status, "rejected"),
            ),
            eq(FriendMatchRequestTable.requesterUserId, userId),
          ),
          and(
            eq(FriendMatchRequestTable.status, "expired"),
            eq(FriendMatchRequestTable.requesterUserId, userId),
            lte(FriendMatchRequestTable.expiresAt, new Date()),
            isNull(FriendMatchRequestTable.matchId),
          ),
        ),
      ),
    );
  if (!existingMatchRequest) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const [deletedMatchRequest] = await db
      .delete(FriendMatchRequestTable)
      .where(eq(FriendMatchRequestTable.id, existingMatchRequest.id))
      .returning();
    if (!deletedMatchRequest)
      throw new Error("Failed to delete match request.");

    return {
      error: false,
      message: "Match request deleted successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const acceptMatchRequestAction = async (matchRequestId: string) => {
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingMatchRequest] = await db
    .select({
      ...getTableColumns(FriendMatchRequestTable),
      problem: getTableColumns(ProblemTable),
    })
    .from(FriendMatchRequestTable)
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, FriendMatchRequestTable.problemId),
    )
    .where(
      and(
        eq(FriendMatchRequestTable.id, matchRequestId),
        eq(FriendMatchRequestTable.recipientUserId, userId),
        eq(FriendMatchRequestTable.status, "pending"),
        or(
          gt(FriendMatchRequestTable.expiresAt, new Date()),
          isNull(FriendMatchRequestTable.expiresAt),
        ),
        isNull(FriendMatchRequestTable.matchId),
      ),
    );
  if (!existingMatchRequest) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const { updatedMatchRequest, notificationId, createdMatch } =
      await db.transaction(async (tx) => {
        const [createdArenaProblem] = await tx
          .insert(ArenaProblemConfigTable)
          .values({
            problemId: existingMatchRequest.problemId,
            timeLimit: existingMatchRequest.timeLimit ?? 0,
          })
          .returning();
        if (!createdArenaProblem)
          throw new Error("Failed to create arena problem.");

        const [createdMatch] = await tx
          .insert(MatchTable)
          .values({
            problemId: createdArenaProblem.id,
            status: "in-progress",
            expiresAt: existingMatchRequest.timeLimit
              ? new Date(
                  new Date().getTime() + existingMatchRequest.timeLimit * 1000,
                )
              : null,
            kind: "friend_challenge",
          })
          .returning();
        if (!createdMatch) throw new Error("Failed to create match.");

        await tx.insert(UserMatchTable).values([
          {
            userId: existingMatchRequest.requesterUserId,
            matchId: createdMatch.id,
          },
          {
            userId: existingMatchRequest.recipientUserId,
            matchId: createdMatch.id,
          },
        ]);

        const updatedMatchRequest = await updateMatchRequestDb(
          existingMatchRequest.id,
          {
            status: "accepted",
            respondedAt: new Date(),
            matchId: createdMatch.id,
          },
          tx,
        );
        if (!updatedMatchRequest)
          throw new Error("Failed to update match request.");

        const createdNotification = await insertNotificationDb(
          {
            userId: existingMatchRequest.requesterUserId,
            payload: {
              type: "match_request_accepted",
              matchRequestId: updatedMatchRequest.id,
              friendshipId: updatedMatchRequest.friendshipId,
              matchId: createdMatch.id,
              title: "Match request accepted",
              message: `${userInfo.name} accepted your match request "${existingMatchRequest.problem.title}".`,
            },
          },
          tx,
        );
        if (!createdNotification)
          throw new Error("Failed to create notification.");

        return {
          updatedMatchRequest,
          notificationId: createdNotification.id,
          createdMatch,
        };
      });

    return {
      error: false,
      message: "Match request accepted successfully!",
      matchRequestId: updatedMatchRequest.id,
      notificationId,
      matchId: createdMatch.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const sendMatchObserverInvitationsAction = async (
  matchId: string,
  unsafeData: MatchObserverInvitationSchemaType,
) => {
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = matchObserverInvitationSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const [existingUserMatch] = await db
    .select({
      ...getTableColumns(UserMatchTable),
      match: getTableColumns(MatchTable),
    })
    .from(UserMatchTable)
    .innerJoin(MatchTable, eq(MatchTable.id, UserMatchTable.matchId))
    .where(
      and(
        eq(UserMatchTable.matchId, matchId),
        eq(UserMatchTable.userId, userId),
        eq(MatchTable.status, "in-progress"),
        eq(MatchTable.kind, "friend_challenge"),
        or(isNull(MatchTable.expiresAt), gt(MatchTable.expiresAt, new Date())),
      ),
    );

  const existingFriends = await db
    .select({
      ...getTableColumns(FriendshipTable),
      user: getTableColumns(user),
    })
    .from(FriendshipTable)
    .innerJoin(
      user,
      or(
        and(
          eq(FriendshipTable.userOneId, userId),
          eq(FriendshipTable.userTwoId, user.id),
        ),
        and(
          eq(FriendshipTable.userOneId, user.id),
          eq(FriendshipTable.userTwoId, userId),
        ),
      ),
    )
    .where(
      and(
        or(
          eq(FriendshipTable.userOneId, userId),
          eq(FriendshipTable.userTwoId, userId),
        ),
        isNull(FriendshipTable.deletedAt),
        inArray(
          FriendshipTable.id,
          data.friends.map((friend) => friend.id),
        ),
      ),
    );
  if (existingFriends.length !== data.friends.length) {
    return {
      error: true,
      message: "All users must be your friends. Please check and try again.",
    };
  }

  try {
    const notificationIds = await db.transaction(async (tx) => {
      const createdMatchObserverInvitations = await tx
        .insert(MatchObserverInvitationTable)
        .values(
          existingFriends.map((friend) => ({
            matchId: existingUserMatch.matchId,
            inviterUserId: userId,
            invitedUserId: friend.user.id,
            friendshipId: friend.id,
          })),
        )
        .returning();

      if (createdMatchObserverInvitations.length !== existingFriends.length)
        throw new Error("Failed to send invitations.");

      const createdNotifications = await Promise.all(
        createdMatchObserverInvitations.map((invitation) =>
          insertNotificationDb(
            {
              userId: invitation.invitedUserId,
              payload: {
                type: "new_match_observer_invitation",
                matchId: existingUserMatch.matchId,
                matchObserverInvitationId: invitation.id,
                title: "New match invitation",
                message: `${userInfo.name} sent you an invitation to observe their match.`,
              },
            },
            tx,
          ),
        ),
      );
      if (
        createdNotifications.length !== createdMatchObserverInvitations.length
      )
        throw new Error("Failed to create notifications.");

      return createdNotifications.map((notification) => notification.id);
    });

    return {
      error: false,
      message: "Match observer invitations sent successfully!",
      notificationIds,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getUserMatchObserverInvitationsAction = async (filterOptions: {
  search: string;
  sortBy: SortByType;
  filterBy: MatchRequestFilterByOptionType;
  statuses: MatchObserverInvitationStatusType[];
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { search, sortBy, filterBy, statuses, page } = filterOptions;
  const offset = (page - 1) * PAGE_SIZE;

  const sortByMap: Record<SortByType, SQL<unknown>> = {
    most_recent: desc(MatchObserverInvitationTable.createdAt),
    oldest: asc(MatchObserverInvitationTable.createdAt),
  };

  const filterByMap: Record<
    MatchRequestFilterByOptionType,
    SQL<unknown> | undefined
  > = {
    all: or(
      eq(MatchObserverInvitationTable.invitedUserId, userId),
      eq(MatchObserverInvitationTable.inviterUserId, userId),
    ),
    sent: eq(MatchObserverInvitationTable.inviterUserId, userId),
    received: eq(MatchObserverInvitationTable.invitedUserId, userId),
  };

  const searchPattern = `%${search.trim()}%`;

  const problemConceptsSearch = sql`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(${ProblemTable.concepts}) AS concept(value)
        WHERE concept.value ILIKE ${searchPattern}
      )
    `;

  const searchQuery = search.trim()
    ? or(
        problemConceptsSearch,
        exists(
          db
            .select()
            .from(UserMatchTable)
            .innerJoin(user, eq(user.id, UserMatchTable.userId))
            .where(
              and(
                not(eq(UserMatchTable.userId, userId)),
                eq(UserMatchTable.matchId, MatchTable.id),
                or(
                  ilike(user.name, searchPattern),
                  ilike(user.email, searchPattern),
                ),
              ),
            ),
        ),
        ilike(ProblemTable.title, searchPattern),
        ilike(ProblemTable.description, searchPattern),
      )
    : undefined;

  const statusQuery = statuses.length
    ? inArray(MatchObserverInvitationTable.status, statuses)
    : undefined;

  const whereQuery = and(searchQuery, filterByMap[filterBy], statusQuery);

  const matchObserverInvitations = await db
    .select({
      ...getTableColumns(MatchObserverInvitationTable),
      match: getTableColumns(MatchTable),
      problem: getTableColumns(ProblemTable),
      participants: sql<
        (typeof UserMatchTable.$inferSelect & { user: User })[]
      >`(
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'userId', umt.user_id,
              'matchId', umt.match_id,
              'code', umt.code,
              'user', json_build_object(
                'id', ut.id,
                'name', ut.name,
                'email', ut.email,
                'emailVerified', ut.email_verified,
                'image', ut.image,
                'createdAt', ut.created_at,
                'updatedAt', ut.updated_at
              )
            )
          ),
          '[]'::jsonb
        )
        FROM ${UserMatchTable} umt
        JOIN ${user} ut ON umt.user_id = ut.id
        WHERE umt.match_id = ${MatchTable.id}
      )`,
    })
    .from(MatchObserverInvitationTable)
    .innerJoin(
      MatchTable,
      eq(MatchTable.id, MatchObserverInvitationTable.matchId),
    )
    .innerJoin(
      ArenaProblemConfigTable,
      eq(ArenaProblemConfigTable.id, MatchTable.problemId),
    )
    .innerJoin(
      ProblemTable,
      eq(ProblemTable.id, ArenaProblemConfigTable.problemId),
    )
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalMatchObserverInvitations] = await db
    .select({
      count: count(),
    })
    .from(MatchObserverInvitationTable)
    .innerJoin(
      MatchTable,
      eq(MatchTable.id, MatchObserverInvitationTable.matchId),
    )
    .innerJoin(ProblemTable, eq(ProblemTable.id, MatchTable.problemId))
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalMatchObserverInvitations.count;

  return {
    currentUserId: userId,
    matchObserverInvitations,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};

export const updateMatchObserverInvitationStatusAction = async (
  matchObserverInvitationId: string,
  newStatus: Extract<MatchObserverInvitationStatusType, "rejected" | "revoked">,
) => {
  if (!areValidIds([matchObserverInvitationId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const statusMap: Record<
    Extract<MatchObserverInvitationStatusType, "rejected" | "revoked">,
    SQL<unknown>
  > = {
    rejected: eq(MatchObserverInvitationTable.invitedUserId, userId),
    revoked: eq(MatchObserverInvitationTable.inviterUserId, userId),
  };

  const whereQuery = and(
    eq(MatchObserverInvitationTable.id, matchObserverInvitationId),
    or(
      eq(MatchObserverInvitationTable.status, "pending"),
      eq(MatchObserverInvitationTable.status, "accepted"),
    ),
    eq(MatchTable.status, "in-progress"),
    or(gt(MatchTable.expiresAt, new Date()), isNull(MatchTable.expiresAt)),
    statusMap[newStatus],
  );

  const [existingMatchInvitation] = await db
    .select({
      ...getTableColumns(MatchObserverInvitationTable),
      match: getTableColumns(MatchTable),
      matchObserver: getTableColumns(MatchObserverTable),
    })
    .from(MatchObserverInvitationTable)
    .innerJoin(
      MatchTable,
      eq(MatchTable.id, MatchObserverInvitationTable.matchId),
    )
    .leftJoin(MatchObserverTable, eq(MatchObserverTable.matchId, MatchTable.id))
    .where(whereQuery);
  if (!existingMatchInvitation) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const notificationId = await db.transaction(async (tx) => {
      const [updatedInvitation] = await tx
        .update(MatchObserverInvitationTable)
        .set({
          status: newStatus,
          respondedAt: new Date(),
        })
        .where(eq(MatchObserverInvitationTable.id, existingMatchInvitation.id))
        .returning();
      if (!updatedInvitation)
        throw new Error("Failed to update match observer invitation status.");

      const createdNotification = await insertNotificationDb(
        {
          userId:
            newStatus === "rejected"
              ? updatedInvitation.inviterUserId
              : updatedInvitation.invitedUserId,
          payload: {
            type: `match_observer_invitation_${newStatus}` as const,
            matchObserverInvitationId: updatedInvitation.id,
            matchId: updatedInvitation.matchId,
            title: `Match invitation ${newStatus}`,
            message: `${userInfo.name} ${newStatus} your invitation to watch ${newStatus === "rejected" ? "your" : "their"} match.`,
          },
        },
        tx,
      );
      if (!createdNotification)
        throw new Error("Failed to create notification.");

      return createdNotification.id;
    });

    return {
      error: false,
      message: `Match observer invitation ${newStatus} successfully!`,
      notificationId,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const acceptMatchObserverInvitationAction = async (
  matchObserverInvitationId: string,
) => {
  if (!areValidIds([matchObserverInvitationId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }
  const { userId, user: userInfo } = await getCurrentUser({ allData: true });
  if (!userId || !userInfo) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const [existingMatchObserverInvitation] = await db
    .select({
      ...getTableColumns(MatchObserverInvitationTable),
      match: getTableColumns(MatchTable),
    })
    .from(MatchObserverInvitationTable)
    .innerJoin(
      MatchTable,
      eq(MatchTable.id, MatchObserverInvitationTable.matchId),
    )
    .where(
      and(
        eq(MatchObserverInvitationTable.id, matchObserverInvitationId),
        eq(MatchObserverInvitationTable.invitedUserId, userId),
        eq(MatchTable.status, "in-progress"),
        or(isNull(MatchTable.expiresAt), gt(MatchTable.expiresAt, new Date())),
        eq(MatchObserverInvitationTable.status, "pending"),
        isNull(MatchObserverInvitationTable.respondedAt),
      ),
    );
  if (!existingMatchObserverInvitation) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const { matchId, notificationId } = await db.transaction(async (tx) => {
      const [updatedInvitation] = await tx
        .update(MatchObserverInvitationTable)
        .set({
          status: "accepted",
          respondedAt: new Date(),
        })
        .where(
          eq(
            MatchObserverInvitationTable.id,
            existingMatchObserverInvitation.id,
          ),
        )
        .returning();
      if (!updatedInvitation) throw new Error("Failed to update invitation.");

      const [createdMatchObserver] = await db
        .insert(MatchObserverTable)
        .values({
          invitationId: updatedInvitation.id,
          userId,
          invitedByUserId: updatedInvitation.inviterUserId,
          matchId: updatedInvitation.matchId,
        })
        .returning();
      if (!createdMatchObserver)
        throw new Error("Failed to create match observer.");

      const createdNotification = await insertNotificationDb(
        {
          userId: updatedInvitation.inviterUserId,
          payload: {
            type: "match_observer_invitation_accepted",
            matchId: updatedInvitation.matchId,
            matchObserverInvitationId: updatedInvitation.id,
            title: "Match invitation accepted",
            message: `${userInfo.name} accepted your invitation to observe your match.`,
          },
        },
        tx,
      );
      if (!createdNotification)
        throw new Error("Failed to create notification.");

      return {
        matchId: updatedInvitation.matchId,
        notificationId: createdNotification.id,
      };
    });

    return {
      error: false,
      message: "Match invitation accepted successfully!",
      matchId,
      notificationId,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getMatchObserverAccessAction = async (matchId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingUserMatch] = await db
    .select({
      ...getTableColumns(UserMatchTable),
      match: getTableColumns(MatchTable),
    })
    .from(UserMatchTable)
    .innerJoin(MatchTable, eq(MatchTable.id, UserMatchTable.matchId))
    .where(
      and(
        eq(UserMatchTable.userId, userId),
        eq(MatchTable.id, matchId),
        eq(MatchTable.status, "in-progress"),
        or(isNull(MatchTable.expiresAt), gt(MatchTable.expiresAt, new Date())),
      ),
    );
  if (!existingUserMatch) return null;

  const matchObservers = await db
    .select({
      ...getTableColumns(MatchObserverInvitationTable),
      user: getTableColumns(user),
      matchObserver: getTableColumns(MatchObserverTable),
    })
    .from(MatchObserverInvitationTable)
    .innerJoin(user, eq(user.id, MatchObserverInvitationTable.invitedUserId))
    .leftJoin(
      MatchObserverTable,
      eq(MatchObserverInvitationTable.id, MatchObserverTable.invitationId),
    )
    .where(
      and(
        eq(MatchObserverInvitationTable.matchId, existingUserMatch.matchId),
        or(
          eq(MatchObserverInvitationTable.status, "accepted"),
          eq(MatchObserverInvitationTable.status, "pending"),
        ),
      ),
    );

  return matchObservers;
};
