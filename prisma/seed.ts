import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedExampleVenues } from "./seed-example-venues";
import { seedIntegrationsDemo } from "./seed-integrations";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const org = await prisma.organization.upsert({
    where: { id: "seed-org" },
    update: {},
    create: {
      id: "seed-org",
      name: "Grupo Demo",
    },
  });

  const venue = await prisma.venue.upsert({
    where: { slug: "la-trattoria" },
    update: {
      capacityMode: "tables",
      totalCapacity: 40,
    },
    create: {
      organizationId: org.id,
      slug: "la-trattoria",
      name: "La Trattoria",
      address: "Calle Mayor 12, Madrid",
      city: "Madrid",
      timezone: "Europe/Madrid",
      isActive: true,
      isListedOnMarketplace: true,
      description: "Restaurante italiano de demostración.",
      cuisineTypes: ["Italiana"],
      establishmentTypes: ["Restaurante"],
      neighborhood: "Centro",
      capacityMode: "tables",
      totalCapacity: 40,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.local" },
    update: {},
    create: {
      email: "owner@demo.local",
      name: "Ana Propietaria",
      passwordHash,
      accountType: "STAFF",
      isSuperAdmin: false,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_venueId: { userId: owner.id, venueId: venue.id },
    },
    update: { role: "OWNER" },
    create: {
      userId: owner.id,
      venueId: venue.id,
      role: "OWNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "diner@demo.local" },
    update: {},
    create: {
      email: "diner@demo.local",
      name: "Carlos Comensal",
      passwordHash,
      accountType: "DINER",
      loyaltyPoints: 100,
      referralCode: "DEMO-DINER",
    },
  });

  const service = await prisma.service.upsert({
    where: { id: "seed-service-comida" },
    update: {
      maxCoversPerSlot: 24,
      maxReservationsPerSlot: 6,
    },
    create: {
      id: "seed-service-comida",
      venueId: venue.id,
      name: "Comida",
      durationMinutes: 90,
      maxCoversPerSlot: 24,
      maxReservationsPerSlot: 6,
      sortOrder: 0,
    },
  });

  const scheduleDays = [1, 2, 3, 4, 5, 6];
  for (const dayOfWeek of scheduleDays) {
    await prisma.serviceSchedule.upsert({
      where: {
        serviceId_dayOfWeek: { serviceId: service.id, dayOfWeek },
      },
      update: { openTime: "13:00", closeTime: "23:30", isActive: true },
      create: {
        serviceId: service.id,
        dayOfWeek,
        openTime: "13:00",
        closeTime: "23:30",
        isActive: true,
      },
    });
  }

  const zone = await prisma.zone.upsert({
    where: { id: "seed-zone-sala" },
    update: {},
    create: {
      id: "seed-zone-sala",
      venueId: venue.id,
      name: "Sala principal",
      sortOrder: 0,
      layoutWidth: 900,
      layoutHeight: 600,
    },
  });

  const demoTables = [
    { id: "seed-table-1", name: "Mesa 1", minCapacity: 2, maxCapacity: 4, posX: 80, posY: 80 },
    { id: "seed-table-2", name: "Mesa 2", minCapacity: 2, maxCapacity: 4, posX: 220, posY: 80 },
    { id: "seed-table-3", name: "Mesa 3", minCapacity: 4, maxCapacity: 6, posX: 360, posY: 80 },
    { id: "seed-table-4", name: "Mesa 4", minCapacity: 4, maxCapacity: 6, posX: 500, posY: 80 },
    { id: "seed-table-5", name: "Mesa 5", minCapacity: 2, maxCapacity: 2, posX: 120, posY: 260 },
    { id: "seed-table-6", name: "Barra 1", minCapacity: 1, maxCapacity: 2, posX: 320, posY: 280, shape: "rect", width: 120, height: 60 },
    { id: "seed-table-7", name: "Terraza 1", minCapacity: 2, maxCapacity: 4, posX: 600, posY: 260 },
    { id: "seed-table-8", name: "Terraza 2", minCapacity: 4, maxCapacity: 8, posX: 720, posY: 260 },
  ] as const;

  for (const table of demoTables) {
    await prisma.table.upsert({
      where: { id: table.id },
      update: {
        zoneId: zone.id,
        name: table.name,
        minCapacity: table.minCapacity,
        maxCapacity: table.maxCapacity,
        posX: table.posX,
        posY: table.posY,
        width: "width" in table ? table.width : 80,
        height: "height" in table ? table.height : 80,
        shape: "shape" in table ? table.shape : "round",
      },
      create: {
        id: table.id,
        zoneId: zone.id,
        name: table.name,
        minCapacity: table.minCapacity,
        maxCapacity: table.maxCapacity,
        posX: table.posX,
        posY: table.posY,
        width: "width" in table ? table.width : 80,
        height: "height" in table ? table.height : 80,
        shape: "shape" in table ? table.shape : "round",
      },
    });
  }

  const integrationStats = await seedIntegrationsDemo(prisma, venue.id, service.id);

  const { upserted, skipped } = await seedExampleVenues(prisma, org.id);

  console.log("Seed complete:");
  console.log("  Staff: owner@demo.local / password123");
  console.log("  Diner: diner@demo.local / password123");
  console.log(`  Venue: /book/${venue.slug}`);
  console.log(`  Example venues: ${upserted} imported, ${skipped} skipped`);
  console.log(
    `  Integrations demo: ${integrationStats.connections} conexiones, ${integrationStats.syncLogs} sync logs, ${integrationStats.channelReservations} reservas canal`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
