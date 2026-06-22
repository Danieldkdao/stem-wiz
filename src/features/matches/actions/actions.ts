"use server";

import { db } from "@/db/db";
import {
  ArenaProblemConfigTable,
  CommunityProblemTable,
  FriendMatchRequestTable,
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
import { auth, User } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
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
  not,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { mapProblemToArenaProblem } from "../lib/formatters";
import {
  UserMatchesFilterByOptionType,
  UserMatchesResultOptionType,
  UserMatchesSortByOptionType,
} from "../lib/params";
import { upsertMatchSubmission } from "../server/match-results";
import {
  friendMatchRequestSchema,
  FriendMatchRequestSchemaType,
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

const finalizeMatchIfAllUsersSubmitted = async (matchId: string) => {
  if (!areValidIds([matchId])) return { finished: false, error: true };
  const latestMatch = await db.query.MatchTable.findFirst({
    where: and(
      eq(MatchTable.id, matchId),
      eq(MatchTable.status, "in-progress"),
      gt(MatchTable.expiresAt, new Date()),
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
        gt(MatchTable.expiresAt, new Date()),
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
      forResults ? undefined : gt(MatchTable.expiresAt, new Date()),
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
      },
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
      existingMatch.expiresAt > new Date() &&
      existingMatch.status === "in-progress")
  )
    return existingMatch;

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
    existingMatch.expiresAt <= new Date()
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
    existingMatch.expiresAt <= new Date()
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
        gt(MatchTable.expiresAt, new Date()),
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const userMatch = await db.query.UserMatchTable.findFirst({
    where: and(
      eq(UserMatchTable.userId, session.user.id),
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
  page: number;
}) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { search, sortBy, languages, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const sortByMap: Record<UserMatchesSortByOptionType, SQL<unknown>> = {
    most_recent: desc(MatchTable.createdAt),
    oldest: asc(MatchTable.createdAt),
    expires_soon: asc(MatchTable.expiresAt),
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
    not(
      exists(
        db
          .select()
          .from(UserMatchTable)
          .where(
            and(
              eq(UserMatchTable.matchId, MatchTable.id),
              eq(UserMatchTable.userId, session.user.id),
            ),
          ),
      ),
    ),
    gt(MatchTable.expiresAt, new Date()),
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
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { search, sortBy, filterBy, results, completionReasons, page } =
    filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const currentUserMatch = alias(UserMatchTable, "current_user_match");
  const opponentUserMatch = alias(UserMatchTable, "opponent_user_match");

  const sortByMap: Record<UserMatchesSortByOptionType, SQL<unknown>> = {
    most_recent: desc(MatchTable.createdAt),
    oldest: asc(MatchTable.createdAt),
    expires_soon: asc(MatchTable.expiresAt),
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

  const resultsFilter = results.length
    ? or(...results.map((result) => resultsMap[result]))
    : undefined;
  const completionReasonsFilter = completionReasons.length
    ? inArray(MatchResultTable.reason, completionReasons)
    : undefined;

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
    .where(
      and(
        filterByMap[filterBy],
        resultsFilter,
        completionReasonsFilter,
        search.trim() ? ilike(user.name, `%${search.trim()}%`) : undefined,
      ),
    )
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

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
    .where(
      and(
        filterByMap[filterBy],
        resultsFilter,
        completionReasonsFilter,
        search.trim() ? ilike(user.name, `%${search.trim()}%`) : undefined,
      ),
    );

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

export const saveUserMatchCode = async (matchId: string, newCode: string) => {
  if (!areValidIds([matchId])) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  if (!newCode.trim()) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
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
