import { NextRequest, NextResponse } from "next/server";
import { marketplaceSearchSchema } from "@/lib/validations";
import { searchVenuesPaginated } from "@/domain/marketplace/search-service";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = marketplaceSearchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bounds =
    parsed.data.north != null &&
    parsed.data.south != null &&
    parsed.data.east != null &&
    parsed.data.west != null
      ? {
          north: parsed.data.north,
          south: parsed.data.south,
          east: parsed.data.east,
          west: parsed.data.west,
        }
      : undefined;

  const result = await searchVenuesPaginated({
    city: parsed.data.city,
    cuisine: parsed.data.cuisine,
    date: parsed.data.date,
    partySize: parsed.data.partySize,
    averageTicketRange: parsed.data.averageTicketRange,
    guide: parsed.data.guide,
    establishmentType: parsed.data.establishmentType,
    idealFor: parsed.data.idealFor,
    preference: parsed.data.preference,
    dressCode: parsed.data.dressCode,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    radiusKm: parsed.data.radiusKm,
    sort: parsed.data.sort,
    bounds,
    cursor: parsed.data.cursor,
    take: parsed.data.take,
    requireCoords: !!bounds || parsed.data.sort === "distance",
  });

  return NextResponse.json(result);
}
