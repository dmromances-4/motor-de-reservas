import { prisma } from "@/lib/prisma";
import { fetchPlaceDetails, placePhotoUrl } from "@/lib/google";
import {
  connectIntegration,
  markIntegrationSynced,
} from "./connection-service";

export async function importFromPlaceId(venueId: string, placeId: string) {
  const details = await fetchPlaceDetails(placeId);
  if (!details) {
    throw new Error("PLACE_NOT_FOUND");
  }

  const galleryUrls =
    details.photoNames
      ?.slice(0, 5)
      .map((name) => placePhotoUrl(name))
      .filter((url): url is string => Boolean(url)) ?? [];

  await prisma.venue.update({
    where: { id: venueId },
    data: {
      googlePlaceId: details.placeId,
      phone: details.phone ?? undefined,
      address: details.formattedAddress ?? undefined,
      latitude: details.latitude ?? undefined,
      longitude: details.longitude ?? undefined,
      businessHours: details.periods
        ? { weekdayText: details.weekdayText, periods: details.periods }
        : details.weekdayText
          ? { weekdayText: details.weekdayText }
          : undefined,
      galleryUrls: galleryUrls.length > 0 ? galleryUrls : undefined,
      menuUrl: details.website ?? undefined,
      averageRating: details.rating ?? undefined,
      reviewCount: details.userRatingsTotal ?? undefined,
    },
  });

  await connectIntegration(venueId, "google_business", {
    externalId: details.placeId,
    metadata: { name: details.name, importedAt: new Date().toISOString() },
  });
  await markIntegrationSynced(venueId, "google_business");

  return details;
}
