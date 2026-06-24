"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireVenueAccess } from "@/lib/auth";
import { assignReservationTables } from "@/domain/floor-plan/floor-plan-service";

export async function updateTableLayout(
  venueId: string,
  tableId: string,
  data: {
    posX: number;
    posY: number;
    width?: number;
    height?: number;
    rotation?: number;
  },
) {
  await requireVenueAccess(venueId);
  await prisma.table.update({
    where: { id: tableId, zone: { venueId } },
    data,
  });
  revalidatePath("/dashboard/floor-plan");
}

export async function createTable(
  venueId: string,
  zoneId: string,
  data: { name: string; minCapacity: number; maxCapacity: number; posX: number; posY: number },
) {
  await requireVenueAccess(venueId);
  await prisma.table.create({
    data: { zoneId, ...data },
  });
  revalidatePath("/dashboard/floor-plan");
}

export async function deleteTable(venueId: string, tableId: string) {
  await requireVenueAccess(venueId);
  await prisma.table.delete({
    where: { id: tableId, zone: { venueId } },
  });
  revalidatePath("/dashboard/floor-plan");
}

export async function assignTablesAction(
  venueId: string,
  reservationId: string,
  tableIds: string[],
) {
  await requireVenueAccess(venueId);
  try {
    await assignReservationTables(reservationId, venueId, tableIds);
    revalidatePath("/dashboard/host");
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}

export async function updateTableStatus(
  venueId: string,
  tableId: string,
  status: "FREE" | "RESERVED" | "OCCUPIED" | "BLOCKED",
) {
  await requireVenueAccess(venueId);
  await prisma.table.update({
    where: { id: tableId, zone: { venueId } },
    data: { status },
  });
  revalidatePath("/dashboard/host");
}

export async function createZone(
  venueId: string,
  data: { name: string; layoutWidth?: number; layoutHeight?: number },
) {
  await requireVenueAccess(venueId);
  const count = await prisma.zone.count({ where: { venueId } });
  await prisma.zone.create({
    data: {
      venueId,
      name: data.name,
      sortOrder: count,
      layoutWidth: data.layoutWidth ?? 800,
      layoutHeight: data.layoutHeight ?? 600,
    },
  });
  revalidatePath("/dashboard/floor-plan");
}

export async function updateZone(
  venueId: string,
  zoneId: string,
  data: {
    name?: string;
    layoutWidth?: number;
    layoutHeight?: number;
    backgroundUrl?: string | null;
  },
) {
  await requireVenueAccess(venueId);
  await prisma.zone.update({
    where: { id: zoneId, venueId },
    data,
  });
  revalidatePath("/dashboard/floor-plan");
  revalidatePath("/dashboard/host");
}

export async function deleteZone(venueId: string, zoneId: string) {
  await requireVenueAccess(venueId);
  await prisma.zone.delete({
    where: { id: zoneId, venueId },
  });
  revalidatePath("/dashboard/floor-plan");
}

export async function updateTableDetails(
  venueId: string,
  tableId: string,
  data: {
    name?: string;
    minCapacity?: number;
    maxCapacity?: number;
    status?: "FREE" | "RESERVED" | "OCCUPIED" | "BLOCKED";
    width?: number;
    height?: number;
    rotation?: number;
    shape?: string;
  },
) {
  await requireVenueAccess(venueId);
  await prisma.table.update({
    where: { id: tableId, zone: { venueId } },
    data,
  });
  revalidatePath("/dashboard/floor-plan");
  revalidatePath("/dashboard/host");
}
