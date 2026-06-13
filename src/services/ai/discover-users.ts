import { generateText, Output } from "ai";
import { discoverUsersSchema } from "./schemas";
import {
  fetchUsers,
  type AiUserCandidate,
  type FetchUsersToolOutput,
} from "./tools";
import { hackclub } from "./models/hackclub";
import { User } from "@/lib/auth/auth";
import { UserProfileTable } from "@/db/schema";
import {
  DISCOVER_USERS_RANKING_SYSTEM_PROMPT,
  DISCOVER_USERS_SYSTEM_PROMPT,
  generateDiscoverUsersRankingPrompt,
  generateDiscoverUsersPrompt,
} from "./prompts";

const MAX_FETCH_USERS_CALLS = 3;

type ToolStep = Readonly<{
  toolCalls: ReadonlyArray<{ toolName: string }>;
  toolResults: ReadonlyArray<{ toolName: string; output: unknown }>;
}>;

const isFetchUsersToolOutput = (
  output: unknown,
): output is FetchUsersToolOutput =>
  typeof output === "object" &&
  output !== null &&
  "ok" in output &&
  "users" in output &&
  Array.isArray((output as { users: unknown }).users);

const countFetchUsersCalls = (steps: ReadonlyArray<ToolStep>) =>
  steps.reduce(
    (count, step) =>
      count +
      step.toolCalls.filter((toolCall) => toolCall.toolName === "fetch_users")
        .length,
    0,
  );

const hasUsableFetchUsersResult = (steps: ReadonlyArray<ToolStep>) =>
  steps.some((step) =>
    step.toolResults.some(
      (toolResult) =>
        toolResult.toolName === "fetch_users" &&
        isFetchUsersToolOutput(toolResult.output) &&
        toolResult.output.ok &&
        toolResult.output.users.length > 0,
    ),
  );

const collectCandidateUsers = (
  steps: ReadonlyArray<ToolStep>,
  currentUserId: string,
) => {
  const candidatesById = new Map<string, AiUserCandidate>();

  steps.forEach((step) => {
    step.toolResults.forEach((toolResult) => {
      if (
        toolResult.toolName !== "fetch_users" ||
        !isFetchUsersToolOutput(toolResult.output)
      ) {
        return;
      }

      toolResult.output.users.forEach((candidate) => {
        if (candidate.id !== currentUserId) {
          candidatesById.set(candidate.id, candidate);
        }
      });
    });
  });

  return Array.from(candidatesById.values());
};

export const discoverUsers = async (
  user: User & { profile: typeof UserProfileTable.$inferSelect },
  prompt: string,
) => {
  try {
    const searchResult = await generateText({
      model: hackclub("google/gemini-3-flash-preview"),
      system: DISCOVER_USERS_SYSTEM_PROMPT,
      prompt: generateDiscoverUsersPrompt(user, prompt),
      tools: {
        fetch_users: fetchUsers,
      },
      stopWhen: [
        ({ steps }) => hasUsableFetchUsersResult(steps),
        ({ steps }) => countFetchUsersCalls(steps) >= MAX_FETCH_USERS_CALLS,
      ],
    });

    const candidates = collectCandidateUsers(searchResult.steps, user.id);

    const { output } = await generateText({
      model: hackclub("google/gemini-3-flash-preview"),
      system: DISCOVER_USERS_RANKING_SYSTEM_PROMPT,
      output: Output.object({
        schema: discoverUsersSchema,
      }),
      prompt: generateDiscoverUsersRankingPrompt({
        user,
        prompt,
        candidates,
      }),
    });

    return output;
  } catch (error) {
    console.error(error);
    return null;
  }
};
