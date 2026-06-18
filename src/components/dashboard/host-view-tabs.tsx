"use client";

import { useState } from "react";
import { HostFloorMap } from "@/components/dashboard/host-floor-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReservationRow = {
  id: string;
  partySize: number;
  guestName: string;
  serviceName: string;
  timeLabel: string;
  actions: React.ReactNode;
};

export function HostViewTabs({
  venueId,
  venueSlug,
  reservations,
}: {
  venueId: string;
  venueSlug?: string;
  reservations: ReservationRow[];
}) {
  const [tab, setTab] = useState<"timeline" | "map">("timeline");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("timeline")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "timeline"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Timeline
        </button>
        <button
          type="button"
          onClick={() => setTab("map")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "map" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Mapa
        </button>
      </div>

      {tab === "map" ? (
        <HostFloorMap
          venueId={venueId}
          venueSlug={venueSlug}
          reservations={reservations.map((r) => ({
            id: r.id,
            guestName: r.guestName,
            partySize: r.partySize,
            timeLabel: r.timeLabel,
          }))}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Timeline del día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservations.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin reservas hoy.</p>
            ) : (
              reservations.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {r.timeLabel} — {r.guestName}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {r.partySize} pax · {r.serviceName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">{r.actions}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
