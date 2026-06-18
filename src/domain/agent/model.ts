import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AgentModelProvider = "google" | "openai" | "none";

export function resolveAgentModel(): {
  model: LanguageModel | null;
  provider: AgentModelProvider;
  modelId: string | null;
} {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const modelId = process.env.AGENT_MODEL_GOOGLE ?? "gemini-2.5-flash";
    return { model: google(modelId), provider: "google", modelId };
  }

  if (process.env.OPENAI_API_KEY) {
    const modelId = process.env.AGENT_MODEL_OPENAI ?? "gpt-4o-mini";
    return { model: openai(modelId), provider: "openai", modelId };
  }

  return { model: null, provider: "none", modelId: null };
}
