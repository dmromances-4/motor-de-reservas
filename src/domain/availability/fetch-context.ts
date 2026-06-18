import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/generated/prisma/client";
import { getDayBounds } from "./engine";
import type { AvailabilityInput } from "./types";

type DbClient = PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export async function buildAvailabilityInput(
  params: {
    venueId: string;
    date: string;
    partySize: number;
    serviceId?: string;
    excludeReservationId?: string;
  },
  db: DbClient = prisma,
): Promise<AvailabilityInput | null> {
  const venue = await db.venue.findUnique({
    where: { id: params.venueId },
    include: {
      services: {
        where: { isActive: true },
        include: { schedules: true },
      },
      closureExceptions: true,
      availabilityBlocks: true,
      zones: { include: { tables: true } },
    },
  });

  if (!venue || !venue.isActive) return null;

  const service =
    venue.services.find((s) => s.id === params.serviceId) ??
    venue.services[0];

  if (!service) return null;

  const isClosed = venue.closureExceptions.some(
    (c) => c.date.toISOString().slice(0, 10) === params.date,
  );

  const { start, end } = getDayBounds(params.date, venue.timezone);

  const reservations = await db.reservation.findMany({
    where: {
      venueId: params.venueId,
      serviceId: service.id,
      dateTime: { gte: start, lt: end },
      status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
      ...(params.excludeReservationId
        ? { id: { not: params.excludeReservationId } }
        : {}),
    },
    include: { tables: { select: { tableId: true } } },
  });

  const blocks = venue.availabilityBlocks.filter(
    (b) =>
      (!b.serviceId || b.serviceId === service.id) &&
      b.endTime > start &&
      b.startTime < end,
  );

  const tables =
    venue.capacityMode === "tables"
      ? venue.zones.flatMap((z) => z.tables)
      : undefined;

  return {
    date: params.date,
    partySize: params.partySize,
    isClosed,
    venue: {
      timezone: venue.timezone,
      capacityMode: venue.capacityMode as "simple" | "tables",
      totalCapacity: venue.totalCapacity,
      slotIntervalMinutes: venue.slotIntervalMinutes,
      bufferMinutes: venue.bufferMinutes,
      maxPartySize: venue.maxPartySize,
    },
    service: {
      id: service.id,
      durationMinutes: service.durationMinutes,
      schedules: service.schedules,
    },
    existingReservations: reservations.map((r) => ({
      dateTime: r.dateTime,
      partySize: r.partySize,
      durationMinutes: r.durationMinutes,
      status: r.status,
      tableIds: r.tables.map((t) => t.tableId),
    })),
    blocks: blocks.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    })),
    tables: tables?.map((t) => ({
      id: t.id,
      minCapacity: t.minCapacity,
      maxCapacity: t.maxCapacity,
      status: t.status,
    })),
  };
}
