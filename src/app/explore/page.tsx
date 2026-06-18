import { Suspense } from "react";
import Link from "next/link";
import { searchVenues } from "@/domain/marketplace/search-service";
import { SearchFilters } from "@/components/marketplace/search-filters";
import { ExploreView } from "@/components/marketplace/explore-view";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { hasPublicMapsKey, publicMapsKey } from "@/lib/google";
import type { AverageTicketRange, DressCode } from "@/generated/prisma/client";
import type { GuideFilter } from "@/domain/marketplace/search-service";

type Props = {
  searchParams: Promise<{
    city?: string;
    cuisine?: string;
    date?: string;
    partySize?: string;
    averageTicketRange?: string;
    guide?: string;
    establishmentType?: string;
    idealFor?: string;
    preference?: string;
    dressCode?: string;
    view?: string;
    lat?: string;
    lng?: string;
    radiusKm?: string;
    sort?: string;
    north?: string;
    south?: string;
    east?: string;
    west?: string;
    cursor?: string;
  }>;
};

export const metadata = {
  title: "Explorar locales | Motor de Reservas",
  description: "Descubre y reserva los mejores locales",
};

function parseBounds(params: Awaited<Props["searchParams"]>) {
  if (
    params.north &&
    params.south &&
    params.east &&
    params.west
  ) {
    return {
      north: Number(params.north),
      south: Number(params.south),
      east: Number(params.east),
      west: Number(params.west),
    };
  }
  return undefined;
}

export default async function ExplorePage({ searchParams }: Props) {
  const params = await searchParams;
  const bounds = parseBounds(params);

  const venues = await searchVenues({
    city: params.city,
    cuisine: params.cuisine,
    date: params.date,
    partySize: params.partySize ? Number(params.partySize) : undefined,
    averageTicketRange: params.averageTicketRange as
      | AverageTicketRange
      | undefined,
    guide: params.guide as GuideFilter | undefined,
    establishmentType: params.establishmentType,
    idealFor: params.idealFor,
    preference: params.preference,
    dressCode: params.dressCode as DressCode | undefined,
    lat: params.lat ? Number(params.lat) : undefined,
    lng: params.lng ? Number(params.lng) : undefined,
    radiusKm: params.radiusKm ? Number(params.radiusKm) : undefined,
    sort: params.sort === "distance" ? "distance" : undefined,
    bounds,
    cursor: params.cursor,
    requireCoords: params.view === "map" || !!bounds,
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="animate-rise mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="inline-block">
            <Wordmark />
          </Link>
          <h1
            className="font-display mt-3 text-3xl font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Explorar locales
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Locales de Europa en Macarfi, Michelin y The World&apos;s 50 Best
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/account">Mi cuenta</Link>
        </Button>
      </div>

      <Suspense fallback={<div style={{ color: "var(--muted)" }}>Cargando filtros...</div>}>
        <SearchFilters />
      </Suspense>

      <Suspense fallback={<div style={{ color: "var(--muted)" }}>Cargando resultados...</div>}>
        <ExploreView
          venues={venues}
          mapsApiKey={publicMapsKey}
          hasMapsKey={hasPublicMapsKey()}
        />
      </Suspense>
    </main>
  );
}
