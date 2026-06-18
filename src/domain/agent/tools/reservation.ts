import { tool } from "ai";
import { z } from "zod";
import {
  createReservation,
  updateReservation,
} from "@/domain/reservations/service";
import { sendReservationNotification } from "@/domain/notifications/service";
import { optimizeTableAssignment } from "@/domain/agent/table-optimizer";
import { prisma } from "@/lib/prisma";
import { auditToolCall, channelToReservationSource } from "@/domain/agent/tools/shared";
import type { AgentToolContext, ToolExecutionResult } from "@/domain/agent/types";

const createReservationToolSchema = z.object({
  serviceId: z.string().min(1),
  dateTime: z.string().datetime(),
  partySize: z.number().int().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().min(6).max(20).optional(),
  notes: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
});

const modifyReservationSchema = z.object({
  reservationId: z.string().min(1),
  partySize: z.number().int().min(1).max(50).optional(),
  dateTime: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

const cancelReservationSchema = z.object({
  reservationId: z.string().min(1),
});

export type CreateReservationToolOutput = {
  reservationId: string;
  confirmationCode: string;
  dateTime: string;
  partySize: number;
  suggestDeposit: boolean;
};

export async function executeReservationCreate(
  ctx: AgentToolContext,
  input: z.infer<typeof createReservationToolSchema>,
): Promise<ToolExecutionResult<CreateReservationToolOutput>> {
  const started = Date.now();

  try {
    const venue = await prisma.venue.findUnique({
      where: { id: ctx.venueId },
    });
    if (!venue) {
      return {
        success: false,
        error: "VENUE_NOT_FOUND",
        latencyMs: Date.now() - started,
      };
    }

    let tableIds: string[] | undefined;
    if (ctx.agentTableOptimizationEnabled && venue.capacityMode === "tables") {
      const optimized = await optimizeTableAssignment({
        venueId: ctx.venueId,
        dateTime: input.dateTime,
        partySize: input.partySize,
        serviceId: input.serviceId,
      });
      if (optimized?.tableIds.length) {
        tableIds = optimized.tableIds;
      }
    }

    const reservation = await createReservation({
      slug: ctx.venueSlug,
      serviceId: input.serviceId,
      dateTime: input.dateTime,
      partySize: input.partySize,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
      allergies: input.allergies,
      source: channelToReservationSource(ctx.channel),
      tableIds,
    });

    await sendReservationNotification(reservation, "CONFIRMATION");

    const suggestDeposit =
      venue.depositRequired || (reservation.guest.noShowCount ?? 0) > 0;

    return {
      success: true,
      output: {
        reservationId: reservation.id,
        confirmationCode: reservation.confirmationCode,
        dateTime: reservation.dateTime.toISOString(),
        partySize: reservation.partySize,
        suggestDeposit,
      },
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "CREATE_FAILED";
    return {
      success: false,
      error: message,
      latencyMs: Date.now() - started,
    };
  }
}

export async function executeReservationModify(
  ctx: AgentToolContext,
  input: z.infer<typeof modifyReservationSchema>,
): Promise<ToolExecutionResult<{ reservationId: string; status: string }>> {
  const started = Date.now();

  try {
    const updated = await updateReservation(
      input.reservationId,
      ctx.venueId,
      {
        partySize: input.partySize,
        dateTime: input.dateTime,
        notes: input.notes,
      },
    );

    return {
      success: true,
      output: {
        reservationId: updated.id,
        status: updated.status,
      },
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "MODIFY_FAILED",
      latencyMs: Date.now() - started,
    };
  }
}

export async function executeReservationCancel(
  ctx: AgentToolContext,
  input: z.infer<typeof cancelReservationSchema>,
): Promise<ToolExecutionResult<{ reservationId: string; status: string }>> {
  const started = Date.now();

  try {
    const updated = await updateReservation(
      input.reservationId,
      ctx.venueId,
      { status: "CANCELLED" },
    );

    return {
      success: true,
      output: {
        reservationId: updated.id,
        status: updated.status,
      },
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "CANCEL_FAILED",
      latencyMs: Date.now() - started,
    };
  }
}

export function createReservationCreateTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Crea y confirma una reserva real. Obligatorio antes de confirmar al comensal. Requiere email y datos del huésped.",
    inputSchema: createReservationToolSchema,
    execute: async (input) => {
      const result = await executeReservationCreate(ctx, input);
      await auditToolCall(ctx, "reservation.create", input, result);
      if (!result.success || !result.output) {
        throw new Error(result.error ?? "RESERVATION_CREATE_FAILED");
      }
      return result.output;
    },
  });
}

export function createReservationModifyTool(ctx: AgentToolContext) {
  return tool({
    description: "Modifica una reserva existente (comensales, hora o notas).",
    inputSchema: modifyReservationSchema,
    execute: async (input) => {
      const result = await executeReservationModify(ctx, input);
      await auditToolCall(ctx, "reservation.modify", input, result);
      if (!result.success || !result.output) {
        throw new Error(result.error ?? "RESERVATION_MODIFY_FAILED");
      }
      return result.output;
    },
  });
}

export function createReservationCancelTool(ctx: AgentToolContext) {
  return tool({
    description: "Cancela una reserva por su ID.",
    inputSchema: cancelReservationSchema,
    execute: async (input) => {
      const result = await executeReservationCancel(ctx, input);
      await auditToolCall(ctx, "reservation.cancel", input, result);
      if (!result.success || !result.output) {
        throw new Error(result.error ?? "RESERVATION_CANCEL_FAILED");
      }
      return result.output;
    },
  });
}
