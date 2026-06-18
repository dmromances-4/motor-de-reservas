"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { VenueCard } from "@/components/marketplace/venue-card";
import type { MarketplaceVenueResult } from "@/domain/marketplace/search-service";

type ExploreMapProps = {
  venues: MarketplaceVenueResult[];
  mapsApiKey: string;
};

const DEFAULT_CENTER = { lat: 40.4168, lng: -3.7038 };

export function ExploreMap({ venues, mapsApiKey }: ExploreMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const mappable = useMemo(
    () =>
      venues.filter(
        (v) => v.latitude != null && v.longitude != null,
      ),
    [venues],
  );

  const center = useMemo(() => {
    if (mappable.length === 0) return DEFAULT_CENTER;
    const lat =
      mappable.reduce((s, v) => s + v.latitude!, 0) / mappable.length;
    const lng =
      mappable.reduce((s, v) => s + v.longitude!, 0) / mappable.length;
    return { lat, lng };
  }, [mappable]);

  const selected = mappable.find((v) => v.id === selectedId);

  const searchInArea = useCallback(() => {
    if (!mapBounds) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "map");
    params.set("north", String(mapBounds.north));
    params.set("south", String(mapBounds.south));
    params.set("east", String(mapBounds.east));
    params.set("west", String(mapBounds.west));
    router.push(`/explore?${params.toString()}`);
  }, [mapBounds, router, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {mappable.length} locales en el mapa
        </p>
        <Button size="sm" variant="outline" onClick={searchInArea} disabled={!mapBounds}>
          Buscar en esta zona
        </Button>
      </div>

      <APIProvider apiKey={mapsApiKey}>
        <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
          <Map
            defaultCenter={center}
            defaultZoom={mappable.length === 1 ? 14 : 6}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "480px" }}
            onBoundsChanged={(ev) => {
              const b = ev.detail.bounds;
              if (!b) return;
              setMapBounds({
                north: b.north,
                south: b.south,
                east: b.east,
                west: b.west,
              });
            }}
          >
            {mappable.map((venue) => (
              <AdvancedMarker
                key={venue.id}
                position={{ lat: venue.latitude!, lng: venue.longitude! }}
                onClick={() => setSelectedId(venue.id)}
              >
                <Pin
                  background={
                    selectedId === venue.id ? "var(--teal)" : "var(--navy)"
                  }
                  borderColor="#fff"
                  glyphColor="#fff"
                />
              </AdvancedMarker>
            ))}
          </Map>
        </div>
      </APIProvider>

      {selected && (
        <div className="max-w-sm">
          <VenueCard venue={selected} highlighted />
        </div>
      )}
    </div>
  );
}
