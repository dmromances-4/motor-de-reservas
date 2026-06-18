import { generateText, stepCountIs, type ModelMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { buildAgentSystemPrompt } from "@/domain/agent/prompts/system";
import { saveAgentMessage } from "@/domain/agent/audit";
import { createAgentTools } from "@/domain/agent/tools";
import { resolveAgentModel } from "@/domain/agent/model";
import type { AgentChannel } from "@/domain/agent/types";
import {
  redactPii,
  resolveOrCreateChannelConversation,
} from "@/domain/agent/channel-service";

export type RunAgentTurnInput = {
  venueId: string;
  venueSlug: string;
  venueName: string;
  channel: AgentChannel;
  message: string;
  conversationId?: string;
  externalId?: string;
  guestId?: string;
  language?: string;
  timezone?: string;
};

export type RunAgentTurnResult = {
  conversationId: string;
  reply: string;
  modelProvider: string;
  modelId: string | null;
  toolCalls: number;
  latencyMs: number;
  reservationCreated?: { confirmationCode: string };
};

export async function runAgentTurn(
  input: RunAgentTurnInput,
): Promise<RunAgentTurnResult> {
  const started = Date.now();
  const conversation = await resolveOrCreateChannelConversation({
    venueId: input.venueId,
    channel: input.channel,
    conversationId: input.conversationId,
    externalId: input.externalId,
    guestId: input.guestId,
  });

  const venue = await prisma.venue.findUnique({
    where: { id: input.venueId },
    select: {
      agentTableOptimizationEnabled: true,
      depositRequired: true,
    },
  });

  const storeUserMessage =
    input.channel === "whatsapp" ||
    input.channel === "instagram" ||
    input.channel === "phone"
      ? redactPii(input.message)
      : input.message;

  await saveAgentMessage({
    conversationId: conversation.id,
    role: "user",
    content: storeUserMessage,
  });

  const history = await prisma.agentMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const toolCtx = {
    venueId: input.venueId,
    venueSlug: input.venueSlug,
    conversationId: conversation.id,
    channel: input.channel,
    agentTableOptimizationEnabled:
      venue?.agentTableOptimizationEnabled ?? false,
    depositRequired: venue?.depositRequired ?? false,
  };

  const tools = createAgentTools(toolCtx);
  const system = buildAgentSystemPrompt({
    venueName: input.venueName,
    language: input.language,
    timezone: input.timezone,
  });

  const { model, provider, modelId } = resolveAgentModel();

  if (!model) {
    const fallback =
      "El asistente de IA no está configurado (falta GOOGLE_GENERATIVE_AI_API_KEY u OPENAI_API_KEY).";
    await saveAgentMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: fallback,
      latencyMs: Date.now() - started,
    });
    return {
      conversationId: conversation.id,
      reply: fallback,
      modelProvider: "none",
      modelId: null,
      toolCalls: 0,
      latencyMs: Date.now() - started,
    };
  }

  const messages: ModelMessage[] = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const result = await generateText({
    model,
    system,
    messages,
    tools,
    stopWhen: stepCountIs(5),
  });

  const toolCalls = result.steps.reduce(
    (acc, step) => acc + step.toolCalls.length,
    0,
  );

  await saveAgentMessage({
    conversationId: conversation.id,
    role: "assistant",
    content: result.text,
    toolCalls: result.toolCalls.length > 0 ? result.toolCalls : undefined,
    latencyMs: Date.now() - started,
  });

  const createdAction = await prisma.agentAction.findFirst({
    where: {
      conversationId: conversation.id,
      toolName: "reservation.create",
      success: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const createdOutput = createdAction?.output as
    | { confirmationCode?: string }
    | null
    | undefined;

  return {
    conversationId: conversation.id,
    reply: result.text,
    modelProvider: provider,
    modelId,
    toolCalls,
    latencyMs: Date.now() - started,
    reservationCreated: createdOutput?.confirmationCode
      ? { confirmationCode: createdOutput.confirmationCode }
      : undefined,
  };
}
