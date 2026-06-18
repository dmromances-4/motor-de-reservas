"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { VenueCard } from "@/components/marketplace/venue-card";
import { ExploreMap } from "@/components/marketplace/explore-map";
import { Button } from "@/components/ui/button";
import type { MarketplaceVenueResult } from "@/domain/marketplace/search-service";

type ExploreViewProps = {
  venues: MarketplaceVenueResult[];
  mapsApiKey: string;
  hasMapsKey: boolean;
};

function buildViewHref(searchParams: URLSearchParams, view: "list" | "map") {
  const params = new URLSearchParams(searchParams.toString());
  params.set("view", view);
  return `/explore?${params.toString()}`;
}

export function ExploreView({ venues, mapsApiKey, hasMapsKey }: ExploreViewProps) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "list";

  return (
    <div className="mt-8 space-y-6">
      <div className="flex gap-2">
        <Button asChild variant={view === "list" ? "default" : "outline"} size="sm">
          <Link href={buildViewHref(searchParams, "list")}>Lista</Link>
        </Button>
        <Button asChild variant={view === "map" ? "default" : "outline"} size="sm">
          <Link href={buildViewHref(searchParams, "map")}>Mapa</Link>
        </Button>
      </div>

      {view === "map" && hasMapsKey && (
        <ExploreMap venues={venues} mapsApiKey={mapsApiKey} />
      )}

      {view === "map" && !hasMapsKey && (
        <div
          className="rounded-2xl border border-[var(--line)] p-6 text-sm"
          style={{ color: "var(--muted)" }}
        >
          Configura <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para ver el mapa.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No hay locales con esos filtros.</p>
        ) : (
          venues.map((v) => <VenueCard key={v.id} venue={v} />)
        )}
      </div>
    </div>
  );
}
