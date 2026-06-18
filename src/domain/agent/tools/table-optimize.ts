import { tool } from "ai";
import { z } from "zod";
import { optimizeTableAssignment } from "@/domain/agent/table-optimizer";
import { auditToolCall } from "@/domain/agent/tools/shared";
import type { AgentToolContext, ToolExecutionResult } from "@/domain/agent/types";

const tableOptimizeSchema = z.object({
  dateTime: z.string().datetime(),
  partySize: z.number().int().min(1).max(50),
  serviceId: z.string().optional(),
});

export type TableOptimizeOutput = {
  tableIds: string[];
  score: number;
  rationale: string;
  enabled: boolean;
};

export async function executeTableOptimize(
  ctx: AgentToolContext,
  input: z.infer<typeof tableOptimizeSchema>,
): Promise<ToolExecutionResult<TableOptimizeOutput>> {
  const started = Date.now();

  if (!ctx.agentTableOptimizationEnabled) {
    return {
      success: true,
      output: {
        tableIds: [],
        score: 0,
        rationale:
          "Optimización de mesas desactivada para este local. Se usará asignación por defecto del motor.",
        enabled: false,
      },
      latencyMs: Date.now() - started,
    };
  }

  try {
    const result = await optimizeTableAssignment({
      venueId: ctx.venueId,
      dateTime: input.dateTime,
      partySize: input.partySize,
      serviceId: input.serviceId,
    });

    if (!result) {
      return {
        success: false,
        error: "NO_SUITABLE_TABLE",
        latencyMs: Date.now() - started,
      };
    }

    return {
      success: true,
      output: { ...result, enabled: true },
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "OPTIMIZE_ERROR",
      latencyMs: Date.now() - started,
    };
  }
}

export function createTableOptimizeTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Sugiere la mejor mesa para maximizar ticket medio y capacidad futura (solo si está activado en el local).",
    inputSchema: tableOptimizeSchema,
    execute: async (input) => {
      const result = await executeTableOptimize(ctx, input);
      await auditToolCall(ctx, "table.optimizeAssignment", input, result);
      if (!result.success || !result.output) {
        throw new Error(result.error ?? "TABLE_OPTIMIZE_FAILED");
      }
      return result.output;
    },
  });
}

export { tableOptimizeSchema };
