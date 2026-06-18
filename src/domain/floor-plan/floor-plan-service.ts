import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { TableStatus } from "@/generated/prisma/client";

export async function getLiveFloorPlan(venueId: string, date?: string) {
  const day = date ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(`${day}T23:59:59`);

  const zones = await prisma.zone.findMany({
    where: { venueId },
    include: {
      tables: {
        include: {
          reservations: {
            where: {
              reservation: {
                dateTime: { gte: start, lte: end },
                status: { notIn: ["CANCELLED"] },
              },
            },
            include: {
              reservation: {
                include: { guest: true, service: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return { date: day, zones };
}

export async function assignReservationTables(
  reservationId: string,
  venueId: string,
  tableIds: string[],
) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, venueId },
    include: { venue: true },
  });
  if (!reservation) throw new Error("NOT_FOUND");

  const tables = await prisma.table.findMany({
    where: {
      id: { in: tableIds },
      zone: { venueId },
    },
  });
  if (tables.length !== tableIds.length) throw new Error("INVALID_TABLES");

  const totalCapacity = tables.reduce((s, t) => s + t.maxCapacity, 0);
  if (totalCapacity < reservation.partySize) {
    throw new Error("CAPACITY_TOO_LOW");
  }

  const buffer = reservation.venue.bufferMinutes;
  const resStart = reservation.dateTime;
  const resEnd = addMinutes(resStart, reservation.durationMinutes + buffer);

  const overlapping = await prisma.reservation.findMany({
    where: {
      venueId,
      id: { not: reservationId },
      status: { notIn: ["CANCELLED", "COMPLETED"] },
      dateTime: { lt: resEnd },
      tables: { some: { tableId: { in: tableIds } } },
    },
    include: { tables: true },
  });

  for (const other of overlapping) {
    const otherEnd = addMinutes(
      other.dateTime,
      other.durationMinutes + buffer,
    );
    if (other.dateTime < resEnd && otherEnd > resStart) {
      throw new Error("TABLE_CONFLICT");
    }
  }

  await prisma.$transaction([
    prisma.reservationTable.deleteMany({ where: { reservationId } }),
    prisma.reservationTable.createMany({
      data: tableIds.map((tableId) => ({ reservationId, tableId })),
    }),
    ...tableIds.map((tableId) =>
      prisma.table.update({
        where: { id: tableId },
        data: { status: "RESERVED" as TableStatus },
      }),
    ),
  ]);

  return { ok: true };
}

export function tableDisplayStatus(
  table: {
    status: TableStatus;
    reservations: Array<{
      reservation: {
        status: string;
        dateTime: Date;
        durationMinutes: number;
      };
    }>;
  },
  now = new Date(),
  bufferMinutes = 15,
): TableStatus {
  if (table.status === "BLOCKED") return "BLOCKED";

  const active = table.reservations.find((rt) => {
    const r = rt.reservation;
    if (!["SEATED", "CONFIRMED", "PENDING"].includes(r.status)) return false;
    const end = addMinutes(r.dateTime, r.durationMinutes + bufferMinutes);
    return r.dateTime <= now && now < end;
  });

  if (active?.reservation.status === "SEATED") return "OCCUPIED";
  if (active) return "RESERVED";

  const upcoming = table.reservations.find((rt) => {
    const r = rt.reservation;
    if (!["CONFIRMED", "PENDING"].includes(r.status)) return false;
    const windowStart = addMinutes(r.dateTime, -30);
    const windowEnd = addMinutes(r.dateTime, r.durationMinutes + bufferMinutes);
    return now >= windowStart && now < windowEnd;
  });
  if (upcoming) return "RESERVED";

  return "FREE";
}
