"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AVERAGE_TICKET_RANGES,
  AWARD_BADGES,
  CUISINE_TYPES,
  DRESS_CODES,
  ESTABLISHMENT_TYPES,
  IDEAL_FOR,
  PREFERENCE_ACCESSIBILITY,
  PREFERENCE_DIETARY,
} from "@/domain/venue/taxonomy";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [geoError, setGeoError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      if (value) params.set(key, String(value));
    }
    for (const key of ["view", "north", "south", "east", "west", "lat", "lng", "radiusKm", "sort"]) {
      const v = searchParams.get(key);
      if (v && !params.has(key)) params.set(key, v);
    }
    router.push(`/explore?${params.toString()}`);
  }

  function searchNearMe() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", String(pos.coords.latitude));
        params.set("lng", String(pos.coords.longitude));
        params.set("radiusKm", "10");
        params.set("sort", "distance");
        router.push(`/explore?${params.toString()}`);
      },
      () => setGeoError("No se pudo obtener tu ubicación."),
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="shadow-soft grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <Label>Ciudad</Label>
        <Input
          name="city"
          defaultValue={searchParams.get("city") ?? ""}
          placeholder="Madrid"
        />
      </div>
      <div>
        <Label>Cocina</Label>
        <select
          name="cuisine"
          defaultValue={searchParams.get("cuisine") ?? ""}
          className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        >
          <option value="">Todas</option>
          {CUISINE_TYPES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Fecha</Label>
        <Input
          name="date"
          type="date"
          defaultValue={searchParams.get("date") ?? ""}
        />
      </div>
      <div>
        <Label>Comensales</Label>
        <Input
          name="partySize"
          type="number"
          min={1}
          max={12}
          defaultValue={searchParams.get("partySize") ?? "2"}
        />
      </div>
      <div>
        <Label>Ticket medio</Label>
        <select
          name="averageTicketRange"
          defaultValue={searchParams.get("averageTicketRange") ?? ""}
          className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        >
          <option value="">Todos</option>
          {AVERAGE_TICKET_RANGES.map((range) => (
            <option key={range.id} value={range.id}>
              {range.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Guía / galardón</Label>
        <select
          name="guide"
          defaultValue={searchParams.get("guide") ?? ""}
          className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        >
          <option value="">Todas</option>
          {AWARD_BADGES.map((badge) => (
            <option key={badge.id} value={badge.id}>
              {badge.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Tipo de local</Label>
        <select
          name="establishmentType"
          defaultValue={searchParams.get("establishmentType") ?? ""}
          className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        >
          <option value="">Todos</option>
          {ESTABLISHMENT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Ideal para</Label>
        <select
          name="idealFor"
          defaultValue={searchParams.get("idealFor") ?? ""}
          className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        >
          <option value="">Todos</option>
          {IDEAL_FOR.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Preferencia</Label>
        <select
          name="preference"
          defaultValue={searchParams.get("preference") ?? ""}
          className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        >
          <option value="">Todas</option>
          <optgroup label="Dietas">
            {PREFERENCE_DIETARY.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Accesibilidad">
            {PREFERENCE_ACCESSIBILITY.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div>
        <Label>Dress code</Label>
        <select
          name="dressCode"
          defaultValue={searchParams.get("dressCode") ?? ""}
          className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        >
          <option value="">Todos</option>
          {DRESS_CODES.map((code) => (
            <option key={code.id} value={code.id}>
              {code.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit">Buscar locales</Button>
        <Button type="button" variant="outline" onClick={searchNearMe}>
          Cerca de mí
        </Button>
        {geoError && (
          <p className="text-sm text-red-600">{geoError}</p>
        )}
      </div>
    </form>
  );
}
