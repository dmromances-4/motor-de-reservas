import { tool } from "ai";
import { z } from "zod";
import { getAvailabilityBySlug } from "@/domain/reservations/service";
import { auditToolCall } from "@/domain/agent/tools/shared";
import type {
  AgentToolContext,
  AvailabilityCheckInput,
  AvailabilityCheckOutput,
  ToolExecutionResult,
} from "@/domain/agent/types";

const availabilityInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  partySize: z.number().int().min(1).max(50),
  serviceId: z.string().optional(),
});

export async function executeAvailabilityCheck(
  ctx: AgentToolContext,
  input: AvailabilityCheckInput,
): Promise<ToolExecutionResult<AvailabilityCheckOutput>> {
  const started = Date.now();

  try {
    const result = await getAvailabilityBySlug({
      slug: ctx.venueSlug,
      date: input.date,
      partySize: input.partySize,
      serviceId: input.serviceId,
    });

    if (!result) {
      return {
        success: false,
        error: "VENUE_NOT_FOUND",
        latencyMs: Date.now() - started,
      };
    }

    const serviceNameById = new Map(
      result.services.map((s) => [s.id, s.name]),
    );

    const availableSlots = result.slots.filter(
      (slot) => slot.availableCapacity >= input.partySize,
    );

    const output: AvailabilityCheckOutput = {
      venueName: result.venue.name,
      date: input.date,
      partySize: input.partySize,
      slots: availableSlots.map((slot) => {
        const start = new Date(slot.dateTime);
        const duration =
          result.services.find((s) => s.id === slot.serviceId)
            ?.durationMinutes ?? 90;
        const end = new Date(start.getTime() + duration * 60_000);
        return {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          serviceId: slot.serviceId,
          serviceName: serviceNameById.get(slot.serviceId) ?? "Servicio",
          available: true,
        };
      }),
      message:
        availableSlots.length > 0
          ? `${availableSlots.length} hueco(s) disponible(s) para ${input.partySize} persona(s) el ${input.date}.`
          : `No hay huecos para ${input.partySize} persona(s) el ${input.date}.`,
    };

    return {
      success: true,
      output,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AVAILABILITY_ERROR",
      latencyMs: Date.now() - started,
    };
  }
}

export function createAvailabilityCheckTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Consulta disponibilidad real del restaurante para una fecha y número de comensales. Obligatorio antes de confirmar cualquier hueco.",
    inputSchema: availabilityInputSchema,
    execute: async (input) => {
      const result = await executeAvailabilityCheck(ctx, input);
      await auditToolCall(ctx, "availability.check", input, result);

      if (!result.success || !result.output) {
        throw new Error(result.error ?? "AVAILABILITY_CHECK_FAILED");
      }

      return result.output;
    },
  });
}

export { availabilityInputSchema };
