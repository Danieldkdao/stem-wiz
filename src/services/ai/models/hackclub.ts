import { envServer } from "@/data/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const hackclub = createOpenRouter({
  baseURL: "https://ai.hackclub.com/proxy/v1",
  apiKey: envServer.HACKCLUB_AI_API_KEY,
});
