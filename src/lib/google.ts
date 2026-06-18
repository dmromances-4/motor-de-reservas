/**
 * Thin helpers around Google Maps Platform.
 *
 * Everything here degrades gracefully: when the relevant API key is missing the
 * functions return `null` (or an empty result) instead of throwing, so the app
 * keeps building and running without Google credentials.
 */

export const serverMapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
export const publicMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function hasServerMapsKey(): boolean {
  return serverMapsKey.length > 0;
}

export function hasPublicMapsKey(): boolean {
  return publicMapsKey.length > 0;
}

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  postalCode?: string;
  placeId?: string;
  formattedAddress?: string;
};

/** Geocode a free-form address into coordinates. Returns null when unavailable. */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  if (!hasServerMapsKey() || !address.trim()) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", serverMapsKey);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{
        geometry: { location: { lat: number; lng: number } };
        place_id?: string;
        formatted_address?: string;
        address_components?: Array<{ types: string[]; long_name: string }>;
      }>;
    };
    const first = data.results?.[0];
    if (data.status !== "OK" || !first) return null;

    const postal = first.address_components?.find((c) =>
      c.types.includes("postal_code"),
    )?.long_name;

    return {
      latitude: first.geometry.location.lat,
      longitude: first.geometry.location.lng,
      postalCode: postal,
      placeId: first.place_id,
      formattedAddress: first.formatted_address,
    };
  } catch {
    return null;
  }
}

export type PlaceDetails = {
  placeId: string;
  name?: string;
  formattedAddress?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  userRatingsTotal?: number;
  /** Weekly opening hours, Google "weekday_text" style. */
  weekdayText?: string[];
  /** Structured periods from Google Places. */
  periods?: unknown;
  photoNames?: string[];
};

/**
 * Fetch Places (New) details for a place id. Returns null when unavailable.
 */
export async function fetchPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  if (!hasServerMapsKey() || !placeId.trim()) return null;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "internationalPhoneNumber",
    "websiteUri",
    "location",
    "rating",
    "userRatingCount",
    "regularOpeningHours",
    "photos",
  ].join(",");

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": serverMapsKey,
        "X-Goog-FieldMask": fieldMask,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      location?: { latitude?: number; longitude?: number };
      rating?: number;
      userRatingCount?: number;
      regularOpeningHours?: { weekdayDescriptions?: string[]; periods?: unknown };
      photos?: Array<{ name?: string }>;
    };

    return {
      placeId: data.id ?? placeId,
      name: data.displayName?.text,
      formattedAddress: data.formattedAddress,
      phone: data.internationalPhoneNumber,
      website: data.websiteUri,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      rating: data.rating,
      userRatingsTotal: data.userRatingCount,
      weekdayText: data.regularOpeningHours?.weekdayDescriptions,
      periods: data.regularOpeningHours?.periods,
      photoNames: data.photos
        ?.map((p) => p.name)
        .filter((n): n is string => Boolean(n)),
    };
  } catch {
    return null;
  }
}

/**
 * Build a Street View Static image URL for given coordinates.
 * Returns null when the server key is missing.
 */
export function streetViewImageUrl(
  params: {
    latitude?: number | null;
    longitude?: number | null;
    placeId?: string | null;
    width?: number;
    height?: number;
    fov?: number;
  },
): string | null {
  if (!hasServerMapsKey()) return null;
  const { latitude, longitude, placeId, width = 800, height = 480, fov = 80 } =
    params;

  const url = new URL("https://maps.googleapis.com/maps/api/streetview");
  url.searchParams.set("size", `${width}x${height}`);
  url.searchParams.set("fov", String(fov));
  url.searchParams.set("key", serverMapsKey);

  if (placeId) {
    // Street View Static doesn't take place_id directly; prefer coords.
    if (latitude != null && longitude != null) {
      url.searchParams.set("location", `${latitude},${longitude}`);
    } else {
      return null;
    }
  } else if (latitude != null && longitude != null) {
    url.searchParams.set("location", `${latitude},${longitude}`);
  } else {
    return null;
  }

  return url.toString();
}

/** Build a Places photo media URL (Places New) from a photo resource name. */
export function placePhotoUrl(
  photoName: string,
  maxWidthPx = 1200,
): string | null {
  if (!hasServerMapsKey() || !photoName) return null;
  const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  url.searchParams.set("maxWidthPx", String(maxWidthPx));
  url.searchParams.set("key", serverMapsKey);
  return url.toString();
}

const EARTH_RADIUS_KM = 6371;

/** Haversine distance in kilometres between two coordinates. */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Resolve the public base URL for building deep-links. */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}
