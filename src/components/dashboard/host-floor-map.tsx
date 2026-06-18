"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { assignTablesAction, updateTableStatus } from "@/app/actions/floor-plan";

type LiveTable = {
  id: string;
  name: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  displayStatus: string;
  reservation?: {
    id: string;
    guestName: string;
    partySize: number;
    time: string;
    status: string;
  };
};

type LiveZone = {
  id: string;
  name: string;
  layoutWidth: number;
  layoutHeight: number;
  backgroundUrl?: string | null;
  tables: LiveTable[];
};

type PendingReservation = {
  id: string;
  guestName: string;
  partySize: number;
  timeLabel: string;
};

const STATUS_COLORS: Record<string, string> = {
  FREE: "bg-emerald-100 border-emerald-500",
  RESERVED: "bg-amber-100 border-amber-500",
  OCCUPIED: "bg-red-100 border-red-500",
  BLOCKED: "bg-zinc-200 border-zinc-500",
};

export function HostFloorMap({
  venueId,
  venueSlug,
  reservations = [],
}: {
  venueId: string;
  venueSlug?: string;
  reservations?: PendingReservation[];
}) {
  const [zones, setZones] = useState<LiveZone[]>([]);
  const [selected, setSelected] = useState<LiveTable | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const routeKey = venueSlug ?? venueId;

  const load = useCallback(async () => {
    const res = await fetch(`/api/venues/${routeKey}/floor-plan/live`);
    if (res.ok) {
      const data = await res.json();
      setZones(data.zones);
    }
  }, [routeKey]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  async function assignTable(reservationId: string, tableId: string) {
    setMessage("");
    const result = await assignTablesAction(venueId, reservationId, [tableId]);
    if (result.ok) {
      setAssigningId(null);
      setMessage("Mesa asignada");
      await load();
    } else {
      setMessage(result.error ?? "No se pudo asignar");
    }
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      {assigningId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium">Selecciona una mesa libre para asignar la reserva</p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setAssigningId(null)}
          >
            Cancelar
          </Button>
        </div>
      )}

      {reservations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reservations.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant={assigningId === r.id ? "default" : "outline"}
              onClick={() => setAssigningId(r.id)}
            >
              Asignar: {r.timeLabel} {r.guestName}
            </Button>
          ))}
        </div>
      )}

      {zones.map((zone) => (
        <div key={zone.id}>
          <h3 className="mb-2 font-semibold">{zone.name}</h3>
          <div
            className="relative rounded-xl border border-zinc-200 bg-zinc-50"
            style={{
              width: zone.layoutWidth,
              height: zone.layoutHeight,
              maxWidth: "100%",
              backgroundImage: zone.backgroundUrl
                ? `url(${zone.backgroundUrl})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {zone.tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => {
                  if (assigningId && table.displayStatus === "FREE") {
                    void assignTable(assigningId, table.id);
                    return;
                  }
                  setSelected(table);
                }}
                className={`absolute flex flex-col items-center justify-center rounded-md border-2 text-xs font-medium ${STATUS_COLORS[table.displayStatus] ?? STATUS_COLORS.FREE}`}
                style={{
                  left: table.posX,
                  top: table.posY,
                  width: table.width,
                  height: table.height,
                }}
              >
                <span>{table.name}</span>
                {table.reservation && (
                  <span className="text-[10px]">{table.reservation.guestName}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && !assigningId && (
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="font-semibold">{selected.name}</p>
          <p className="text-sm text-zinc-500">Estado: {selected.displayStatus}</p>
          {selected.reservation ? (
            <div className="mt-2 space-y-2 text-sm">
              <p>
                {selected.reservation.guestName} · {selected.reservation.partySize}{" "}
                pax · {selected.reservation.time}
              </p>
              <Button
                size="sm"
                onClick={() =>
                  updateTableStatus(venueId, selected.id, "OCCUPIED")
                }
              >
                Marcar ocupada
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => updateTableStatus(venueId, selected.id, "FREE")}
            >
              Liberar mesa
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
