import { prisma } from "@/lib/prisma";
import { createSquareAdapter } from "./square-adapter";
import { createHoldedAdapter } from "./holded-adapter";
import type { PosAdapter, PosCredentials } from "./adapter";
import type { PosProvider } from "@/generated/prisma/client";

function getAdapter(
  provider: PosProvider,
  credentials: PosCredentials,
): PosAdapter {
  if (provider === "SQUARE") return createSquareAdapter(credentials);
  return createHoldedAdapter(credentials);
}

export async function connectPosIntegration(
  venueId: string,
  provider: PosProvider,
  credentials: PosCredentials,
  externalLocationId?: string,
) {
  const adapter = getAdapter(provider, credentials);
  const ok = await adapter.testConnection();

  return prisma.posIntegration.upsert({
    where: { venueId_provider: { venueId, provider } },
    create: {
      venueId,
      provider,
      credentials,
      externalLocationId,
      status: ok ? "CONNECTED" : "ERROR",
      lastSyncAt: ok ? new Date() : undefined,
    },
    update: {
      credentials,
      externalLocationId,
      status: ok ? "CONNECTED" : "ERROR",
      lastSyncAt: ok ? new Date() : undefined,
    },
  });
}

export async function pushIfCompleted(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      guest: true,
      venue: true,
    },
  });
  if (!reservation || reservation.status !== "COMPLETED") return;

  const integrations = await prisma.posIntegration.findMany({
    where: { venueId: reservation.venueId, status: "CONNECTED" },
  });

  const payload = {
    id: reservation.id,
    partySize: reservation.partySize,
    dateTime: reservation.dateTime,
    notes: reservation.notes,
    guest: reservation.guest,
    venue: {
      name: reservation.venue.name,
      currency: reservation.venue.currency,
    },
  };

  for (const integration of integrations) {
    const creds = integration.credentials as PosCredentials;
    const adapter = getAdapter(integration.provider, creds);

    try {
      const externalId = await adapter.pushCompletedReservation(payload);
      await prisma.posSyncLog.create({
        data: {
          integrationId: integration.id,
          action: "push_completed_reservation",
          status: "ok",
          payload: { reservationId, externalId },
        },
      });
      await prisma.posIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      const ticketCents = reservation.partySize * 2500;
      await prisma.guest.update({
        where: { id: reservation.guestId },
        data: {
          lifetimeSpendCents: { increment: ticketCents },
          lastVisitAt: reservation.dateTime,
        },
      });
    } catch (e) {
      await prisma.posSyncLog.create({
        data: {
          integrationId: integration.id,
          action: "push_completed_reservation",
          status: "error",
          error: e instanceof Error ? e.message : "Error",
        },
      });
    }
  }
}
