import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  buildAvailabilityInput,
} from "@/domain/availability/fetch-context";
import {
  calculateSlots,
  validateSlotAvailable,
} from "@/domain/availability/engine";
import { sendReservationNotification } from "@/domain/notifications/service";
import {
  awardLoyaltyPoints,
  getPlatformDiscountBps,
} from "@/domain/marketplace/loyalty-service";
import { validatePromo } from "@/domain/marketing/promo-service";
import { pushIfCompleted } from "@/domain/pos/pos-service";
import type {
  PaymentStatus,
  ReservationSource,
  ReservationStatus,
} from "@/generated/prisma/client";

type CreateReservationData = {
  slug: string;
  serviceId: string;
  dateTime: string;
  partySize: number;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  notes?: string;
  allergies?: string;
  source?: ReservationSource;
  dinerUserId?: string;
  depositAmountCents?: number;
  depositStatus?: PaymentStatus;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  commissionAmountCents?: number;
  promoCode?: string;
  tableIds?: string[];
};

export async function getAvailabilityBySlug(params: {
  slug: string;
  date: string;
  partySize: number;
  serviceId?: string;
}) {
  const venue = await prisma.venue.findUnique({
    where: { slug: params.slug },
    include: { services: { where: { isActive: true } } },
  });

  if (!venue) return null;

  const input = await buildAvailabilityInput({
    venueId: venue.id,
    date: params.date,
    partySize: params.partySize,
    serviceId: params.serviceId,
  });

  if (!input) return { venue, slots: [], services: venue.services };

  const slots = calculateSlots(input);
  return { venue, slots, services: venue.services };
}

export async function createMarketplaceReservation(
  data: CreateReservationData,
) {
  return createReservation({ ...data, source: "MARKETPLACE" });
}

export async function createReservation(data: CreateReservationData) {
  const venue = await prisma.venue.findUnique({
    where: { slug: data.slug },
  });
  if (!venue) throw new Error("VENUE_NOT_FOUND");

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, venueId: venue.id, isActive: true },
  });
  if (!service) throw new Error("SERVICE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const input = await buildAvailabilityInput(
      {
        venueId: venue.id,
        date: data.dateTime.slice(0, 10),
        partySize: data.partySize,
        serviceId: service.id,
      },
      tx,
    );

    if (!input || !validateSlotAvailable(input, data.dateTime)) {
      throw new Error("SLOT_UNAVAILABLE");
    }

    const slot = calculateSlots(input).find((s) => s.dateTime === data.dateTime);

    let resolvedTableIds: string[] | undefined = slot?.tableIds;

    if (data.tableIds?.length && venue.capacityMode === "tables") {
      const tables = await tx.table.findMany({
        where: {
          id: { in: data.tableIds },
          zone: { venueId: venue.id },
        },
      });
      if (tables.length !== data.tableIds.length) {
        throw new Error("INVALID_TABLES");
      }

      const totalCapacity = tables.reduce((s, t) => s + t.maxCapacity, 0);
      if (totalCapacity < data.partySize) {
        throw new Error("CAPACITY_TOO_LOW");
      }

      if (tables.some((t) => t.status === "BLOCKED")) {
        throw new Error("TABLE_BLOCKED");
      }

      const resStart = new Date(data.dateTime);
      const resEnd = addMinutes(
        resStart,
        service.durationMinutes + venue.bufferMinutes,
      );

      const overlapping = await tx.reservation.findMany({
        where: {
          venueId: venue.id,
          status: { notIn: ["CANCELLED", "COMPLETED"] },
          dateTime: { lt: resEnd },
          tables: { some: { tableId: { in: data.tableIds } } },
        },
      });

      for (const other of overlapping) {
        const otherEnd = addMinutes(
          other.dateTime,
          other.durationMinutes + venue.bufferMinutes,
        );
        if (other.dateTime < resEnd && otherEnd > resStart) {
          throw new Error("TABLE_CONFLICT");
        }
      }

      resolvedTableIds = data.tableIds;
    }

    let guest = await tx.guest.findFirst({
      where: {
        venueId: venue.id,
        email: data.email,
      },
    });

    if (!guest) {
      guest = await tx.guest.create({
        data: {
          venueId: venue.id,
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          allergies: data.allergies,
        },
      });
    } else {
      guest = await tx.guest.update({
        where: { id: guest.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? guest.phone,
          allergies: data.allergies ?? guest.allergies,
        },
      });
    }

    let promoMeta: { promoCodeId: string; discountCents: number } | null = null;
    if (data.promoCode) {
      const promo = await validatePromo({
        code: data.promoCode,
        venueId: venue.id,
        partySize: data.partySize,
        date: data.dateTime.slice(0, 10),
      });
      if (!promo.ok) throw new Error(promo.error);
      promoMeta = {
        promoCodeId: promo.promoCodeId,
        discountCents: promo.discountCents,
      };
    }

    let tierDiscountCents = 0;
    if (
      data.dinerUserId &&
      (data.source === "MARKETPLACE" || data.source === undefined)
    ) {
      const diner = await tx.user.findUnique({
        where: { id: data.dinerUserId },
        select: { loyaltyPoints: true },
      });
      if (diner && venue.depositAmountCents > 0) {
        const tierBps = getPlatformDiscountBps(diner.loyaltyPoints);
        tierDiscountCents = Math.floor(
          (venue.depositAmountCents * tierBps) / 10000,
        );
      }
    }

    const totalDiscountCents =
      (promoMeta?.discountCents ?? 0) + tierDiscountCents;

    const reservation = await tx.reservation.create({
      data: {
        venueId: venue.id,
        serviceId: service.id,
        guestId: guest.id,
        dinerUserId: data.dinerUserId,
        dateTime: new Date(data.dateTime),
        partySize: data.partySize,
        durationMinutes: service.durationMinutes,
        status: "CONFIRMED",
        source: data.source ?? "WIDGET",
        notes: data.notes,
        allergies: data.allergies,
        depositAmountCents: data.depositAmountCents,
        depositStatus: data.depositStatus,
        stripeCheckoutSessionId: data.stripeCheckoutSessionId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        commissionAmountCents: data.commissionAmountCents,
        promoCodeId: promoMeta?.promoCodeId,
        discountCents: totalDiscountCents > 0 ? totalDiscountCents : undefined,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "CONFIRMED",
            note:
              data.source === "MARKETPLACE"
                ? "Reserva marketplace"
                : "Reserva creada",
          },
        },
        tables: resolvedTableIds?.length
          ? {
              create: resolvedTableIds.map((tableId) => ({ tableId })),
            }
          : undefined,
      },
      include: {
        guest: true,
        service: true,
        venue: true,
      },
    });

    await tx.guest.update({
      where: { id: guest.id },
      data: { visitCount: { increment: 1 } },
    });

    if (promoMeta) {
      await tx.promoRedemption.create({
        data: {
          promoCodeId: promoMeta.promoCodeId,
          reservationId: reservation.id,
          guestId: guest.id,
          discountCents: promoMeta.discountCents,
        },
      });
      await tx.promoCode.update({
        where: { id: promoMeta.promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (resolvedTableIds?.length) {
      for (const tableId of resolvedTableIds) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: "RESERVED" },
        });
      }
    }

    return reservation;
  });
}

export async function updateReservation(
  reservationId: string,
  venueId: string,
  data: {
    status?: ReservationStatus;
    partySize?: number;
    dateTime?: string;
    notes?: string;
  },
  changedBy?: string,
) {
  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, venueId },
  });
  if (!existing) throw new Error("NOT_FOUND");

  if (data.dateTime || data.partySize) {
    const targetDateTime = data.dateTime ?? existing.dateTime.toISOString();
    const input = await buildAvailabilityInput({
      venueId,
      date: targetDateTime.slice(0, 10),
      partySize: data.partySize ?? existing.partySize,
      serviceId: existing.serviceId,
      excludeReservationId: reservationId,
    });
    if (!input || !validateSlotAvailable(input, targetDateTime)) {
      throw new Error("SLOT_UNAVAILABLE");
    }
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: data.status,
      partySize: data.partySize,
      dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
      notes: data.notes,
      statusHistory: data.status
        ? {
            create: {
              fromStatus: existing.status,
              toStatus: data.status,
              changedBy,
            },
          }
        : undefined,
    },
    include: { guest: true, service: true, venue: true },
  });

  if (data.status === "CANCELLED") {
    await sendReservationNotification(updated, "CANCELLATION");
  }

  if (data.status === "NO_SHOW") {
    await prisma.guest.update({
      where: { id: updated.guestId },
      data: { noShowCount: { increment: 1 } },
    });
  }

  if (data.status === "COMPLETED") {
    await awardLoyaltyPoints(reservationId);
    await pushIfCompleted(reservationId);
  }

  if (data.status === "SEATED") {
    const tableLinks = await prisma.reservationTable.findMany({
      where: { reservationId },
    });
    for (const link of tableLinks) {
      await prisma.table.update({
        where: { id: link.tableId },
        data: { status: "OCCUPIED" },
      });
    }
  }

  return updated;
}

export async function getDashboardStats(venueId: string) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [todayCount, weekCount, byStatus, bySource] = await Promise.all([
    prisma.reservation.count({
      where: {
        venueId,
        dateTime: { gte: startOfToday, lte: endOfToday },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    prisma.reservation.count({
      where: {
        venueId,
        dateTime: { gte: weekAgo },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    prisma.reservation.groupBy({
      by: ["status"],
      where: { venueId, dateTime: { gte: weekAgo } },
      _count: true,
    }),
    prisma.reservation.groupBy({
      by: ["source"],
      where: { venueId, dateTime: { gte: weekAgo } },
      _count: true,
    }),
  ]);

  return { todayCount, weekCount, byStatus, bySource };
}
