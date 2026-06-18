import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/google";
import { buildAvailabilityInput } from "@/domain/availability/fetch-context";
import { calculateSlots } from "@/domain/availability/engine";
import type { AverageTicketRange, DressCode } from "@/generated/prisma/client";

export type GuideFilter =
  | "MACARFI"
  | "MICHELIN"
  | "FIFTY_BEST"
  | "SOLES_REPSOL"
  | "BIB_GOURMAND"
  | "GREEN_STAR";

export type GeoBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MarketplaceSearchParams = {
  city?: string;
  cuisine?: string;
  date?: string;
  partySize?: number;
  averageTicketRange?: AverageTicketRange;
  guide?: GuideFilter;
  establishmentType?: string;
  idealFor?: string;
  preference?: string;
  dressCode?: DressCode;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  bounds?: GeoBounds;
  sort?: "distance" | "rating";
  cursor?: string;
  take?: number;
  requireCoords?: boolean;
};

export type MarketplaceVenueResult = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
  cuisineTypes: string[];
  averageTicketRange: AverageTicketRange | null;
  averageRating: number;
  reviewCount: number;
  coverImageUrl: string | null;
  description: string | null;
  depositAmountCents: number;
  awardBadges: string[];
  michelinStars: number | null;
  fiftyBestRank: number | null;
  hasAvailability?: boolean;
  nextSlot?: string;
  distanceKm?: number;
};

export type MarketplaceSearchResult = {
  venues: MarketplaceVenueResult[];
  nextCursor: string | null;
  total: number;
};

function mapVenue(v: {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
  cuisineTypes: string[];
  averageTicketRange: AverageTicketRange | null;
  averageRating: number;
  reviewCount: number;
  coverImageUrl: string | null;
  description: string | null;
  depositAmountCents: number;
  awardBadges: string[];
  michelinStars: number | null;
  fiftyBestRank: number | null;
}): MarketplaceVenueResult {
  return {
    id: v.id,
    slug: v.slug,
    name: v.name,
    city: v.city,
    latitude: v.latitude,
    longitude: v.longitude,
    googlePlaceId: v.googlePlaceId,
    cuisineTypes: v.cuisineTypes,
    averageTicketRange: v.averageTicketRange,
    averageRating: v.averageRating,
    reviewCount: v.reviewCount,
    coverImageUrl: v.coverImageUrl,
    description: v.description,
    depositAmountCents: v.depositAmountCents,
    awardBadges: v.awardBadges,
    michelinStars: v.michelinStars,
    fiftyBestRank: v.fiftyBestRank,
  };
}

function inBounds(
  lat: number,
  lng: number,
  bounds: GeoBounds,
): boolean {
  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  );
}

function applyGeoFilters(
  venues: MarketplaceVenueResult[],
  params: MarketplaceSearchParams,
): MarketplaceVenueResult[] {
  let filtered = venues.filter(
    (v) => v.latitude != null && v.longitude != null,
  );

  if (params.bounds) {
    filtered = filtered.filter((v) =>
      inBounds(v.latitude!, v.longitude!, params.bounds!),
    );
  }

  if (params.lat != null && params.lng != null && params.radiusKm) {
    filtered = filtered
      .map((v) => ({
        ...v,
        distanceKm: haversineKm(
          { latitude: params.lat!, longitude: params.lng! },
          { latitude: v.latitude!, longitude: v.longitude! },
        ),
      }))
      .filter((v) => (v.distanceKm ?? 0) <= params.radiusKm!);
  } else if (params.lat != null && params.lng != null) {
    filtered = filtered.map((v) => ({
      ...v,
      distanceKm: haversineKm(
        { latitude: params.lat!, longitude: params.lng! },
        { latitude: v.latitude!, longitude: v.longitude! },
      ),
    }));
  }

  if (params.sort === "distance" && params.lat != null && params.lng != null) {
    filtered.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  } else {
    filtered.sort((a, b) => {
      if (b.michelinStars !== a.michelinStars) {
        return (b.michelinStars ?? 0) - (a.michelinStars ?? 0);
      }
      return b.averageRating - a.averageRating;
    });
  }

  return filtered;
}

export async function searchVenues(
  params: MarketplaceSearchParams,
): Promise<MarketplaceVenueResult[]> {
  const result = await searchVenuesPaginated(params);
  return result.venues;
}

export async function searchVenuesPaginated(
  params: MarketplaceSearchParams,
): Promise<MarketplaceSearchResult> {
  const take = Math.min(params.take ?? 50, 100);

  let venues;
  try {
    venues = await prisma.venue.findMany({
      where: {
        isListedOnMarketplace: true,
        isActive: true,
        ...(params.city
          ? { city: { equals: params.city, mode: "insensitive" } }
          : {}),
        ...(params.cuisine ? { cuisineTypes: { has: params.cuisine } } : {}),
        ...(params.averageTicketRange
          ? { averageTicketRange: params.averageTicketRange }
          : {}),
        ...(params.guide ? { awardBadges: { has: params.guide } } : {}),
        ...(params.establishmentType
          ? { establishmentTypes: { has: params.establishmentType } }
          : {}),
        ...(params.idealFor ? { idealFor: { has: params.idealFor } } : {}),
        ...(params.preference
          ? { preferenceTags: { has: params.preference } }
          : {}),
        ...(params.dressCode ? { dressCode: params.dressCode } : {}),
        ...(params.requireCoords
          ? { latitude: { not: null }, longitude: { not: null } }
          : {}),
      },
      orderBy: [
        { michelinStars: "desc" },
        { averageRating: "desc" },
        { reviewCount: "desc" },
      ],
      take: 200,
    });
  } catch {
    return { venues: [], nextCursor: null, total: 0 };
  }

  let mapped = venues.map(mapVenue);

  if (params.bounds || params.lat != null || params.requireCoords) {
    mapped = applyGeoFilters(mapped, params);
  }

  if (params.cursor) {
    const idx = mapped.findIndex((v) => v.id === params.cursor);
    if (idx >= 0) mapped = mapped.slice(idx + 1);
  }

  const total = mapped.length;
  const page = mapped.slice(0, take);
  const nextCursor =
    page.length === take && page.length < total
      ? page[page.length - 1]?.id ?? null
      : null;

  if (!params.date || !params.partySize) {
    return { venues: page, nextCursor, total };
  }

  const results: MarketplaceVenueResult[] = [];

  for (const venue of page) {
    const input = await buildAvailabilityInput({
      venueId: venue.id,
      date: params.date,
      partySize: params.partySize,
    });
    if (!input) continue;
    const slots = calculateSlots(input);
    results.push({
      ...venue,
      hasAvailability: slots.length > 0,
      nextSlot: slots[0]?.dateTime,
    });
  }

  const sorted = results.sort((a, b) => {
    if (a.hasAvailability && !b.hasAvailability) return -1;
    if (!a.hasAvailability && b.hasAvailability) return 1;
    if (params.sort === "distance") {
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    }
    return b.averageRating - a.averageRating;
  });

  return { venues: sorted, nextCursor, total };
}

export async function getMarketplaceVenue(slug: string) {
  return prisma.venue.findFirst({
    where: { slug, isListedOnMarketplace: true, isActive: true },
    include: {
      services: {
        where: { isActive: true },
        select: { id: true, name: true, durationMinutes: true },
        orderBy: { sortOrder: "asc" },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      },
    },
  });
}
