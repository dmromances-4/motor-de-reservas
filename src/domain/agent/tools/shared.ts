import { logAgentAction } from "@/domain/agent/audit";
import type { AgentToolContext, ToolExecutionResult } from "@/domain/agent/types";

export async function auditToolCall(
  ctx: AgentToolContext,
  toolName: string,
  input: unknown,
  result: ToolExecutionResult<unknown>,
) {
  if (!ctx.conversationId) return;

  await logAgentAction({
    conversationId: ctx.conversationId,
    toolName,
    input,
    output: result.output,
    success: result.success,
    error: result.error,
    latencyMs: result.latencyMs,
  });
}

export function channelToReservationSource(
  channel: AgentToolContext["channel"],
): "WIDGET" | "PHONE" | "INSTAGRAM" {
  switch (channel) {
    case "phone":
    case "whatsapp":
      return "PHONE";
    case "instagram":
      return "INSTAGRAM";
    default:
      return "WIDGET";
  }
}
