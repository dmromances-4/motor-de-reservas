import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { buildAvailabilityInput } from "@/domain/availability/fetch-context";
import {
  listAvailableTablesForSlot,
  validateSlotAvailable,
} from "@/domain/availability/engine";

const WALK_IN_LOOKBACK_WEEKS = 8;
const WALK_IN_THRESHOLD = 5;
const WALK_IN_OVERSIZE_PENALTY = 25;

export type TableCandidate = {
  id: string;
  minCapacity: number;
  maxCapacity: number;
};

export type OptimizeTableInput = {
  venueId: string;
  dateTime: string;
  partySize: number;
  serviceId?: string;
};

export type OptimizeTableOutput = {
  tableIds: string[];
  score: number;
  rationale: string;
};

/** Pure scoring for unit tests — higher is better. */
export function scoreTableCandidate(
  partySize: number,
  maxCapacity: number,
  walkInHeavy: boolean,
): number {
  let score = 0;

  if (maxCapacity === partySize) {
    score += 100;
  } else if (maxCapacity > partySize) {
    const excess = maxCapacity - partySize;
    score += Math.max(0, 80 - excess * 20);
  }

  if (walkInHeavy && maxCapacity > partySize) {
    score -= WALK_IN_OVERSIZE_PENALTY;
  }

  return score;
}

export function pickBestTable(
  candidates: TableCandidate[],
  partySize: number,
  walkInHeavy: boolean,
): OptimizeTableOutput | null {
  if (candidates.length === 0) return null;

  let best: { table: TableCandidate; score: number } | null = null;

  for (const table of candidates) {
    const score = scoreTableCandidate(partySize, table.maxCapacity, walkInHeavy);
    if (!best || score > best.score) {
      best = { table, score };
    }
  }

  if (!best) return null;

  const fitted = best.table.maxCapacity === partySize;
  const rationale = fitted
    ? `Mesa ${best.table.maxCapacity} plazas ajustada al grupo de ${partySize} (score ${best.score}).`
    : walkInHeavy
      ? `Mesa de ${best.table.maxCapacity} plazas; turno con histórico alto de walk-ins — se evita mesa mayor si hay alternativa (score ${best.score}).`
      : `Mesa de ${best.table.maxCapacity} plazas para ${partySize} comensales (score ${best.score}).`;

  return {
    tableIds: [best.table.id],
    score: best.score,
    rationale,
  };
}

async function countWalkInsForSlot(
  venueId: string,
  dateTime: Date,
): Promise<number> {
  const slotLocal = new Date(dateTime);
  const dayOfWeek = slotLocal.getDay();
  const hour = slotLocal.getHours();
  const since = addMinutes(new Date(), -WALK_IN_LOOKBACK_WEEKS * 7 * 24 * 60);

  const walkIns = await prisma.reservation.findMany({
    where: {
      venueId,
      source: "WALK_IN",
      status: { notIn: ["CANCELLED"] },
      dateTime: { gte: since },
    },
    select: { dateTime: true },
  });

  return walkIns.filter((r) => {
    const d = new Date(r.dateTime);
    if (d.getDay() !== dayOfWeek) return false;
    const diffHours = Math.abs(d.getHours() - hour);
    return diffHours <= 1;
  }).length;
}

export async function optimizeTableAssignment(
  input: OptimizeTableInput,
): Promise<OptimizeTableOutput | null> {
  const date = input.dateTime.slice(0, 10);
  const availability = await buildAvailabilityInput({
    venueId: input.venueId,
    date,
    partySize: input.partySize,
    serviceId: input.serviceId,
  });

  if (!availability || availability.venue.capacityMode !== "tables") {
    return null;
  }

  if (!validateSlotAvailable(availability, input.dateTime)) {
    return null;
  }

  const slotStart = new Date(input.dateTime);
  const slotEnd = addMinutes(
    slotStart,
    availability.service.durationMinutes + availability.venue.bufferMinutes,
  );

  const tables = availability.tables ?? [];
  const candidates = listAvailableTablesForSlot(
    slotStart,
    slotEnd,
    input.partySize,
    availability.existingReservations,
    tables,
    availability.venue.bufferMinutes,
  );

  const walkInCount = await countWalkInsForSlot(input.venueId, slotStart);
  const walkInHeavy = walkInCount >= WALK_IN_THRESHOLD;

  return pickBestTable(candidates, input.partySize, walkInHeavy);
}
