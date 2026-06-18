import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  extractPendingIntentFromTool,
  mergePendingIntent,
} from "@/domain/agent/pending-intent";

export async function logAgentAction(params: {
  conversationId: string;
  toolName: string;
  input: unknown;
  output?: unknown;
  success: boolean;
  error?: string;
  latencyMs?: number;
}) {
  const action = await prisma.agentAction.create({
    data: {
      conversationId: params.conversationId,
      toolName: params.toolName,
      input: params.input as Prisma.InputJsonValue,
      output:
        params.output !== undefined
          ? (params.output as Prisma.InputJsonValue)
          : undefined,
      success: params.success,
      error: params.error,
      latencyMs: params.latencyMs,
    },
  });

  const patch = extractPendingIntentFromTool(params.toolName, params.input);
  if (Object.keys(patch).length > 0) {
    await mergePendingIntent(params.conversationId, patch);
  }

  return action;
}

export async function saveAgentMessage(params: {
  conversationId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: unknown;
  latencyMs?: number;
}) {
  return prisma.agentMessage.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      toolCalls:
        params.toolCalls !== undefined
          ? (params.toolCalls as Prisma.InputJsonValue)
          : undefined,
      latencyMs: params.latencyMs,
    },
  });
}
