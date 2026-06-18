import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

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
    update: {},
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
    update: {},
    create: {
      id: "seed-service-comida",
      venueId: venue.id,
      name: "Comida",
      durationMinutes: 90,
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
    },
  });

  await prisma.table.upsert({
    where: { id: "seed-table-1" },
    update: {},
    create: {
      id: "seed-table-1",
      zoneId: zone.id,
      name: "Mesa 1",
      minCapacity: 2,
      maxCapacity: 4,
      posX: 100,
      posY: 100,
    },
  });

  console.log("Seed complete:");
  console.log("  Staff: owner@demo.local / password123");
  console.log("  Diner: diner@demo.local / password123");
  console.log(`  Venue: /book/${venue.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
