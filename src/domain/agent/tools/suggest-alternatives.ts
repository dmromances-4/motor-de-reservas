import { tool } from "ai";
import { z } from "zod";
import { buildAvailabilityInput } from "@/domain/availability/fetch-context";
import { calculateSlots } from "@/domain/availability/engine";
import { prisma } from "@/lib/prisma";
import { auditToolCall } from "@/domain/agent/tools/shared";
import type { AgentToolContext, ToolExecutionResult } from "@/domain/agent/types";

const WINDOW_MS = 30 * 60 * 1000;

const suggestAlternativesSchema = z.object({
  preferredDateTime: z.string().datetime(),
  partySize: z.number().int().min(1).max(50),
  serviceId: z.string().optional(),
});

export type SuggestAlternativesOutput = {
  preferredDateTime: string;
  partySize: number;
  exactMatch: boolean;
  alternatives: Array<{
    dateTime: string;
    serviceId: string;
    minutesFromPreferred: number;
  }>;
  message: string;
};

export async function executeSuggestAlternatives(
  ctx: AgentToolContext,
  input: z.infer<typeof suggestAlternativesSchema>,
): Promise<ToolExecutionResult<SuggestAlternativesOutput>> {
  const started = Date.now();

  try {
    const venue = await prisma.venue.findUnique({
      where: { id: ctx.venueId },
      include: { services: { where: { isActive: true } } },
    });
    if (!venue) {
      return {
        success: false,
        error: "VENUE_NOT_FOUND",
        latencyMs: Date.now() - started,
      };
    }

    const date = input.preferredDateTime.slice(0, 10);
    const availability = await buildAvailabilityInput({
      venueId: ctx.venueId,
      date,
      partySize: input.partySize,
      serviceId: input.serviceId,
    });

    if (!availability) {
      return {
        success: false,
        error: "AVAILABILITY_UNAVAILABLE",
        latencyMs: Date.now() - started,
      };
    }

    const slots = calculateSlots(availability);
    const preferredMs = new Date(input.preferredDateTime).getTime();
    const exactMatch = slots.some((s) => s.dateTime === input.preferredDateTime);

    const alternatives = slots
      .map((slot) => {
        const slotMs = new Date(slot.dateTime).getTime();
        const diffMs = Math.abs(slotMs - preferredMs);
        return {
          dateTime: slot.dateTime,
          serviceId: slot.serviceId,
          minutesFromPreferred: Math.round(diffMs / 60_000),
          diffMs,
        };
      })
      .filter((s) => s.diffMs <= WINDOW_MS)
      .sort((a, b) => a.diffMs - b.diffMs)
      .slice(0, 8)
      .map(({ dateTime, serviceId, minutesFromPreferred }) => ({
        dateTime,
        serviceId,
        minutesFromPreferred,
      }));

    const output: SuggestAlternativesOutput = {
      preferredDateTime: input.preferredDateTime,
      partySize: input.partySize,
      exactMatch,
      alternatives,
      message: exactMatch
        ? "La hora solicitada está disponible."
        : alternatives.length > 0
          ? `${alternatives.length} alternativa(s) dentro de ±30 minutos.`
          : "No hay alternativas en ±30 minutos; prueba otro día u horario.",
    };

    return { success: true, output, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SUGGEST_ERROR",
      latencyMs: Date.now() - started,
    };
  }
}

export function createSuggestAlternativesTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Busca huecos alternativos ±30 minutos respecto a la hora preferida si el slot exacto no está libre.",
    inputSchema: suggestAlternativesSchema,
    execute: async (input) => {
      const result = await executeSuggestAlternatives(ctx, input);
      await auditToolCall(ctx, "availability.suggestAlternatives", input, result);
      if (!result.success || !result.output) {
        throw new Error(result.error ?? "SUGGEST_ALTERNATIVES_FAILED");
      }
      return result.output;
    },
  });
}

export { suggestAlternativesSchema };
