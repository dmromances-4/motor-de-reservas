import type { PrismaClient } from "../src/generated/prisma/client";

export async function seedIntegrationsDemo(
  prisma: PrismaClient,
  venueId: string,
  serviceId: string,
) {
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      instagramUrl: "https://instagram.com/latrattoria.demo",
      tripAdvisorUrl: "https://www.tripadvisor.es/Restaurant_Review-la-trattoria",
      theForkUrl: "https://www.thefork.es/restaurante/la-trattoria",
      tiktokUrl: "https://www.tiktok.com/@latrattoria.demo",
      isListedOnMarketplace: true,
    },
  });

  const square = await prisma.posIntegration.upsert({
    where: {
      venueId_provider: { venueId, provider: "SQUARE" },
    },
    update: { status: "CONNECTED", lastSyncAt: new Date() },
    create: {
      venueId,
      provider: "SQUARE",
      status: "CONNECTED",
      credentials: { sandbox: true },
      externalLocationId: "demo-square-location",
      lastSyncAt: new Date(),
    },
  });

  const channelProviders = [
    "google_business",
    "google_reserve",
    "thefork",
    "opentable",
    "instagram",
  ] as const;

  for (const provider of channelProviders) {
    await prisma.integrationConnection.upsert({
      where: { venueId_provider: { venueId, provider } },
      update: { status: "CONNECTED", lastSyncAt: new Date() },
      create: {
        venueId,
        provider,
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
    });
  }

  const syncActions = [
    { action: "import_reservations", status: "SUCCESS" },
    { action: "sync_menu", status: "SUCCESS" },
    { action: "push_availability", status: "SUCCESS" },
    { action: "webhook_received", status: "SUCCESS" },
    { action: "sync_tables", status: "SUCCESS" },
  ];

  for (const [index, entry] of syncActions.entries()) {
    await prisma.posSyncLog.upsert({
      where: { id: `seed-sync-log-${index + 1}` },
      update: {
        integrationId: square.id,
        action: entry.action,
        status: entry.status,
        createdAt: new Date(Date.now() - index * 3600_000),
      },
      create: {
        id: `seed-sync-log-${index + 1}`,
        integrationId: square.id,
        action: entry.action,
        status: entry.status,
        createdAt: new Date(Date.now() - index * 3600_000),
      },
    });
  }

  const demoGuests = [
    { id: "seed-guest-google", firstName: "Laura", lastName: "Google", email: "laura.google@demo.local" },
    { id: "seed-guest-thefork", firstName: "Pablo", lastName: "TheFork", email: "pablo.thefork@demo.local" },
    { id: "seed-guest-phone", firstName: "Marta", lastName: "Teléfono", email: "marta.phone@demo.local" },
    { id: "seed-guest-instagram", firstName: "Sara", lastName: "Instagram", email: "sara.instagram@demo.local" },
  ] as const;

  for (const guest of demoGuests) {
    await prisma.guest.upsert({
      where: { id: guest.id },
      update: {},
      create: {
        id: guest.id,
        venueId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
      },
    });
  }

  const now = new Date();
  const demoReservations = [
    {
      id: "seed-res-google",
      guestId: "seed-guest-google",
      source: "GOOGLE" as const,
      dayOffset: 2,
      hour: 14,
      partySize: 2,
    },
    {
      id: "seed-res-thefork",
      guestId: "seed-guest-thefork",
      source: "THEFORK" as const,
      dayOffset: 3,
      hour: 21,
      partySize: 4,
    },
    {
      id: "seed-res-phone",
      guestId: "seed-guest-phone",
      source: "PHONE" as const,
      dayOffset: 1,
      hour: 13,
      partySize: 3,
    },
    {
      id: "seed-res-instagram",
      guestId: "seed-guest-instagram",
      source: "INSTAGRAM" as const,
      dayOffset: 4,
      hour: 20,
      partySize: 2,
    },
  ];

  for (const reservation of demoReservations) {
    const dateTime = new Date(now);
    dateTime.setDate(dateTime.getDate() + reservation.dayOffset);
    dateTime.setHours(reservation.hour, 0, 0, 0);

    await prisma.reservation.upsert({
      where: { id: reservation.id },
      update: {
        source: reservation.source,
        dateTime,
        partySize: reservation.partySize,
        status: "CONFIRMED",
      },
      create: {
        id: reservation.id,
        venueId,
        serviceId,
        guestId: reservation.guestId,
        dateTime,
        partySize: reservation.partySize,
        durationMinutes: 90,
        status: "CONFIRMED",
        source: reservation.source,
        confirmationCode: reservation.id.toUpperCase().replace("SEED-RES-", "DEMO-"),
      },
    });
  }

  return {
    connections: channelProviders.length + 1,
    syncLogs: syncActions.length,
    channelReservations: demoReservations.length,
  };
}
