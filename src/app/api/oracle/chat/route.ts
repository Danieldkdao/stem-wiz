import { db } from "@/db/db";
import {
  ChatMessageTable,
  ChatTable,
  OracleSessionProblemTable,
  OracleSessionTable,
} from "@/db/schema";
import { revalidateOracleSessionCache } from "@/features/oracle/server/cache/oracle-sessions";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { mistral } from "@/services/ai/models/mistral";
import { generateOracleProblemChatSystemPrompt } from "@/services/ai/prompts";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { and, desc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const {
    messages,
    sessionId,
    problemId,
  }: { messages: UIMessage[]; sessionId: string; problemId: string } =
    await req.json();

  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(
      { error: true, message: UNAUTHED_ERROR_MESSAGE },
      { status: 401 },
    );
  }

  const [existingSession] = await db
    .select()
    .from(OracleSessionTable)
    .where(
      and(
        eq(OracleSessionTable.id, sessionId),
        eq(OracleSessionTable.userId, userId),
        eq(OracleSessionTable.status, "active"),
        isNull(OracleSessionTable.completedAt),
      ),
    );
  if (!existingSession) {
    return NextResponse.json(
      { error: true, message: NOT_FOUND_ERROR_MESSAGE },
      { status: 404 },
    );
  }

  const existingProblem = await db.query.OracleSessionProblemTable.findFirst({
    where: and(
      eq(OracleSessionProblemTable.id, problemId),
      eq(OracleSessionProblemTable.sessionId, existingSession.id),
    ),
    with: {
      problem: true,
      chat: {
        with: {
          messages: {
            orderBy: desc(ChatMessageTable.createdAt),
          },
        },
      },
    },
  });
  if (!existingProblem) {
    return NextResponse.json(
      { error: true, message: NOT_FOUND_ERROR_MESSAGE },
      { status: 404 },
    );
  }

  let existingChat: typeof ChatTable.$inferSelect | null = existingProblem.chat;

  if (!existingChat) {
    [existingChat] = await db
      .insert(ChatTable)
      .values({
        oracleProblemId: existingProblem.id,
      })
      .returning();
  }

  if (!existingChat) {
    return NextResponse.json(
      { error: true, message: GENERAL_ERROR_MESSAGE },
      { status: 500 },
    );
  }

  const latestUserMessage = messages
    .filter((msg) => msg.role === "user")
    .at(-1)
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (!latestUserMessage) {
    return NextResponse.json(
      { error: true, message: "You didn't send a message." },
      { status: 400 },
    );
  }

  const [insertedUserChatMessage] = await db
    .insert(ChatMessageTable)
    .values({
      chatId: existingChat.id,
      text: latestUserMessage,
    })
    .returning();

  if (!insertedUserChatMessage) {
    return NextResponse.json(
      { error: true, message: GENERAL_ERROR_MESSAGE },
      { status: 500 },
    );
  }

  const modelMessages: UIMessage[] = [
    ...(existingProblem.chat?.messages ?? [])
      .slice()
      .reverse()
      .map((message) => ({
        id: message.id,
        role: message.role,
        parts: [{ type: "text" as const, text: message.text }],
        createdAt: message.createdAt,
      })),
    {
      id: insertedUserChatMessage.id,
      role: insertedUserChatMessage.role,
      parts: [{ type: "text", text: latestUserMessage }],
      createdAt: insertedUserChatMessage.createdAt,
    },
  ];

  revalidateOracleSessionCache(userId, existingSession.id);

  const result = streamText({
    model: mistral("mistral-medium-latest"),
    system: generateOracleProblemChatSystemPrompt({
      session: existingSession,
      oracleProblem: existingProblem,
    }),
    messages: await convertToModelMessages(modelMessages),
  });

  return result.toUIMessageStreamResponse({
    onFinish: async (data) => {
      if (data.isAborted) return;

      const chatMessage = data.responseMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
      if (!chatMessage) return;

      await db
        .insert(ChatMessageTable)
        .values({
          chatId: existingChat.id,
          text: chatMessage,
          role: "assistant",
        })
        .returning();

      revalidateOracleSessionCache(userId, existingSession.id);
    },
  });
};
