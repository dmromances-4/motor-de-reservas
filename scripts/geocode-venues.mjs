#!/usr/bin/env node
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const venues = await prisma.venue.findMany({
  where: {
    OR: [{ latitude: null }, { longitude: null }],
    city: { not: null },
  },
  select: { id: true, name: true, city: true, address: true },
});

if (venues.length === 0) {
  console.log("No venues need geocoding.");
  process.exit(0);
}

console.log(
  `Found ${venues.length} venue(s) without coordinates. Set GOOGLE_MAPS_API_KEY and implement geocoding as needed.`,
);
for (const venue of venues) {
  console.log(`- ${venue.name} (${venue.city ?? "unknown city"})`);
}

await prisma.$disconnect();
