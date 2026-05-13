import { envServer } from "@/data/env/server";
import { createMistral } from "@ai-sdk/mistral";

export const mistral = createMistral({
  apiKey: envServer.MISTRAL_API_KEY,
});
