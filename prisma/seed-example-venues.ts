import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type AverageTicketRange,
  type Prisma,
} from "../src/generated/prisma/client";

export type GuideVenue = {
  slug: string;
  name: string;
  city: string;
  country?: string;
  address?: string | null;
  venueType?: string;
  photoUrl?: string | null;
  history?: string | null;
  verdict?: string | null;
  worlds50bestRank?: number | null;
  establishmentTypes?: string[];
  cuisineTypes?: string[];
  starDishes?: string[];
  idealFor?: string[];
  venueFeatures?: string[];
  neighborhood?: string | null;
  priceRange?: string | null;
  dailyMenuEnabled?: boolean;
  dailyMenuNote?: string | null;
  awards?: string[];
  venuePreferences?: string[];
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
};

const DATA_FILE = path.resolve(process.cwd(), "data", "example-venues.json");
const BATCH_SIZE = 25;
const SCHEDULE_DAYS = [1, 2, 3, 4, 5, 6];

function mapPriceRange(
  priceRange: string | null | undefined,
): AverageTicketRange | undefined {
  if (!priceRange) return undefined;
  const map: Record<string, AverageTicketRange> = {
    under_15: "LT_15",
    range_15_30: "RANGE_15_30",
    range_30_50: "RANGE_30_50",
    over_50: "GT_50",
  };
  return map[priceRange];
}

function mapEstablishmentTypes(venue: GuideVenue): string[] {
  if (venue.establishmentTypes?.length) return venue.establishmentTypes;
  if (venue.venueType === "cocteleria") return ["Coctelería"];
  if (venue.venueType === "restaurante") return ["Restaurante"];
  return [];
}

function buildDescription(venue: GuideVenue): string | undefined {
  const parts = [venue.verdict, venue.history].filter(Boolean) as string[];
  if (parts.length === 0) return undefined;
  const text = parts.join("\n\n");
  return text.length > 4000 ? `${text.slice(0, 3997)}...` : text;
}

export function mapGuideVenueToPrisma(
  venue: GuideVenue,
  organizationId: string,
): Prisma.VenueUncheckedCreateInput {
  return {
    organizationId,
    slug: venue.slug,
    name: venue.name,
    city: venue.city || null,
    address: venue.address ?? null,
    description: buildDescription(venue),
    coverImageUrl: venue.photoUrl ?? null,
    establishmentTypes: mapEstablishmentTypes(venue),
    cuisineTypes: venue.cuisineTypes ?? [],
    signatureDishes: venue.starDishes ?? [],
    idealFor: venue.idealFor ?? [],
    venueFeatures: venue.venueFeatures ?? [],
    neighborhood: venue.neighborhood ?? null,
    averageTicketRange: mapPriceRange(venue.priceRange),
    hasDailyMenu: venue.dailyMenuEnabled ?? false,
    dailyMenuDescription: venue.dailyMenuNote ?? null,
    awardBadges: venue.awards ?? [],
    preferenceTags: venue.venuePreferences ?? [],
    fiftyBestRank: venue.worlds50bestRank ?? null,
    instagramUrl: venue.instagramUrl ?? null,
    tiktokUrl: venue.tiktokUrl ?? null,
    isListedOnMarketplace: true,
    isActive: true,
    timezone: "Europe/Madrid",
  };
}

async function ensureDefaultService(
  prisma: PrismaClient,
  venueId: string,
  slug: string,
) {
  const serviceId = `example-svc-${slug}`;
  const service = await prisma.service.upsert({
    where: { id: serviceId },
    update: {
      venueId,
      name: "Comida",
      durationMinutes: 90,
      sortOrder: 0,
      isActive: true,
    },
    create: {
      id: serviceId,
      venueId,
      name: "Comida",
      durationMinutes: 90,
      sortOrder: 0,
    },
  });

  for (const dayOfWeek of SCHEDULE_DAYS) {
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
}

export async function seedExampleVenues(
  prisma: PrismaClient,
  organizationId: string,
  options?: { dataFile?: string; skipSlug?: string },
): Promise<{ upserted: number; skipped: number }> {
  const dataFile = options?.dataFile ?? DATA_FILE;
  const skipSlug = options?.skipSlug ?? "la-trattoria";

  if (!fs.existsSync(dataFile)) {
    console.warn(`No example venues file at ${dataFile}, skipping.`);
    return { upserted: 0, skipped: 0 };
  }

  const venues = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as GuideVenue[];
  let upserted = 0;
  let skipped = 0;

  console.log(`Importing ${venues.length} example venues from ${path.basename(dataFile)}…`);

  for (let i = 0; i < venues.length; i += BATCH_SIZE) {
    const batch = venues.slice(i, i + BATCH_SIZE);
    for (const guide of batch) {
      if (guide.slug === skipSlug) {
        skipped++;
        continue;
      }
      const data = mapGuideVenueToPrisma(guide, organizationId);
      const venue = await prisma.venue.upsert({
        where: { slug: guide.slug },
        update: data,
        create: data,
      });
      await ensureDefaultService(prisma, venue.id, guide.slug);
      upserted++;
    }
    console.log(
      `  … ${Math.min(i + BATCH_SIZE, venues.length)}/${venues.length} locales`,
    );
  }

  return { upserted, skipped };
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const org = await prisma.organization.upsert({
      where: { id: "seed-org" },
      update: {},
      create: { id: "seed-org", name: "Grupo Demo" },
    });

    const { upserted, skipped } = await seedExampleVenues(prisma, org.id);
    console.log(`Example venues seed complete: ${upserted} upserted, ${skipped} skipped.`);
  } finally {
    await prisma.$disconnect();
  }
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
