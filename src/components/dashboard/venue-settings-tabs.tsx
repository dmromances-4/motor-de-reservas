"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateVenueSettings } from "@/app/actions/dashboard";
import {
  AVERAGE_TICKET_RANGES,
  AWARD_BADGES,
  CUISINE_TYPES,
  DRESS_CODES,
  ESTABLISHMENT_TYPES,
  IDEAL_FOR,
  VENUE_FEATURES,
  PREFERENCE_DIETARY,
  PREFERENCE_ACCESSIBILITY,
  PREFERENCE_PETS_KIDS,
  PREFERENCE_FACILITIES,
  PREFERENCE_PAYMENTS,
  PREFERENCE_EVENTS,
  MAX_SIGNATURE_DISHES,
} from "@/domain/venue/taxonomy";
import type { AverageTicketRange, DressCode } from "@/generated/prisma/client";

type Venue = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  totalCapacity: number;
  capacityMode: string;
  maxPartySize: number;
  bufferMinutes: number;
  menuUrl: string | null;
  cancellationHours: number;
  primaryColor: string;
  isListedOnMarketplace: boolean;
  description: string | null;
  coverImageUrl: string | null;
  cuisineTypes: string[];
  city: string | null;
  averageTicketRange: AverageTicketRange | null;
  depositAmountCents: number;
  marketplaceCommissionBps: number;
  establishmentTypes: string[];
  signatureDishes: string[];
  idealFor: string[];
  venueFeatures: string[];
  neighborhood: string | null;
  hasDailyMenu: boolean;
  dailyMenuDescription: string | null;
  awardBadges: string[];
  michelinStars: number | null;
  fiftyBestRank: number | null;
  instagramUrl: string | null;
  tripAdvisorUrl: string | null;
  theForkUrl: string | null;
  tiktokUrl: string | null;
  preferenceTags: string[];
  dressCode: DressCode | null;
  agentTableOptimizationEnabled: boolean;
  agentChatEnabled: boolean;
};

const TABS = [
  { id: "operation", label: "Operación" },
  { id: "identity", label: "Identidad" },
  { id: "ambience", label: "Ambiente" },
  { id: "pricing", label: "Precios" },
  { id: "awards", label: "Galardones" },
  { id: "links", label: "Links" },
  { id: "preferences", label: "Preferencias" },
] as const;

function CheckboxGroup({
  name,
  options,
  selected,
}: {
  name: string;
  options: { id: string; label: string }[];
  selected: string[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <label key={opt.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={name}
            value={opt.id}
            defaultChecked={selected.includes(opt.id)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function collectChecked(form: FormData, name: string): string[] {
  return form.getAll(name).map(String);
}

function isValidTab(id: string): id is (typeof TABS)[number]["id"] {
  return TABS.some((t) => t.id === id);
}

export function VenueSettingsTabs({
  venue,
  initialTab,
}: {
  venue: Venue;
  initialTab?: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(
    initialTab && isValidTab(initialTab) ? initialTab : "operation",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const signatureDishes = String(form.get("signatureDishes") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_SIGNATURE_DISHES);

    try {
      const result = await updateVenueSettings({
        venueId: venue.id,
        name: String(form.get("name") ?? ""),
        address: String(form.get("address") ?? ""),
        phone: String(form.get("phone") ?? ""),
        totalCapacity: Number(form.get("totalCapacity")),
        capacityMode: String(form.get("capacityMode") ?? "simple"),
        maxPartySize: Number(form.get("maxPartySize")),
        bufferMinutes: Number(form.get("bufferMinutes")),
        menuUrl: String(form.get("menuUrl") ?? "") || null,
        cancellationHours: Number(form.get("cancellationHours")),
        primaryColor: String(form.get("primaryColor") ?? ""),
        isListedOnMarketplace: form.get("isListedOnMarketplace") === "on",
        description: String(form.get("description") ?? ""),
        coverImageUrl: String(form.get("coverImageUrl") ?? ""),
        city: String(form.get("city") ?? ""),
        depositAmountCents: Number(form.get("depositAmountCents")),
        marketplaceCommissionBps: Number(form.get("marketplaceCommissionBps")),
        cuisineTypes: collectChecked(form, "cuisineTypes"),
        establishmentTypes: collectChecked(form, "establishmentTypes"),
        idealFor: collectChecked(form, "idealFor"),
        venueFeatures: collectChecked(form, "venueFeatures"),
        awardBadges: collectChecked(form, "awardBadges"),
        preferenceTags: collectChecked(form, "preferenceTags"),
        signatureDishes,
        neighborhood: String(form.get("neighborhood") ?? "") || undefined,
        averageTicketRange:
          (form.get("averageTicketRange") as AverageTicketRange) || null,
        hasDailyMenu: form.get("hasDailyMenu") === "on",
        dailyMenuDescription:
          String(form.get("dailyMenuDescription") ?? "") || undefined,
        michelinStars: form.get("michelinStars")
          ? Number(form.get("michelinStars"))
          : null,
        fiftyBestRank: form.get("fiftyBestRank")
          ? Number(form.get("fiftyBestRank"))
          : null,
        instagramUrl: String(form.get("instagramUrl") ?? "") || undefined,
        tripAdvisorUrl: String(form.get("tripAdvisorUrl") ?? "") || undefined,
        theForkUrl: String(form.get("theForkUrl") ?? "") || undefined,
        tiktokUrl: String(form.get("tiktokUrl") ?? "") || undefined,
        dressCode: (form.get("dressCode") as DressCode) || null,
        agentTableOptimizationEnabled:
          form.get("agentTableOptimizationEnabled") === "on",
        agentChatEnabled: form.get("agentChatEnabled") === "on",
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Guardado correctamente");
    } catch {
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message && (
        <p
          className={`text-sm ${
            message === "Guardado correctamente"
              ? "text-emerald-700"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "operation" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={venue.name} />
          </div>
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" name="address" defaultValue={venue.address ?? ""} />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={venue.phone ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="totalCapacity">Capacidad total</Label>
              <Input id="totalCapacity" name="totalCapacity" type="number" defaultValue={venue.totalCapacity} />
            </div>
            <div>
              <Label htmlFor="capacityMode">Modo capacidad</Label>
              <select
                id="capacityMode"
                name="capacityMode"
                defaultValue={venue.capacityMode}
                className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
              >
                <option value="simple">Simple (cubiertos)</option>
                <option value="tables">Por mesas</option>
              </select>
            </div>
            <div>
              <Label htmlFor="maxPartySize">Máx. comensales/reserva</Label>
              <Input id="maxPartySize" name="maxPartySize" type="number" defaultValue={venue.maxPartySize} />
            </div>
            <div>
              <Label htmlFor="bufferMinutes">Buffer (min)</Label>
              <Input id="bufferMinutes" name="bufferMinutes" type="number" defaultValue={venue.bufferMinutes} />
            </div>
            <div>
              <Label htmlFor="cancellationHours">Cancelación (horas antes)</Label>
              <Input id="cancellationHours" name="cancellationHours" type="number" defaultValue={venue.cancellationHours} />
            </div>
          </div>
          <div>
            <Label htmlFor="menuUrl">URL del menú</Label>
            <Input id="menuUrl" name="menuUrl" defaultValue={venue.menuUrl ?? ""} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="primaryColor">Color del widget</Label>
            <Input id="primaryColor" name="primaryColor" type="color" defaultValue={venue.primaryColor} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isListedOnMarketplace" defaultChecked={venue.isListedOnMarketplace} />
            Listar en el marketplace público
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="agentTableOptimizationEnabled"
              defaultChecked={venue.agentTableOptimizationEnabled}
            />
            Optimización de mesas por IA (agente)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="agentChatEnabled"
              defaultChecked={venue.agentChatEnabled}
            />
            Chat con asistente IA en widget de reservas
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="depositAmountCents">Depósito (céntimos)</Label>
              <Input id="depositAmountCents" name="depositAmountCents" type="number" defaultValue={venue.depositAmountCents} />
            </div>
            <div>
              <Label htmlFor="marketplaceCommissionBps">Comisión (bps)</Label>
              <Input id="marketplaceCommissionBps" name="marketplaceCommissionBps" type="number" defaultValue={venue.marketplaceCommissionBps} />
            </div>
          </div>
        </div>
      )}

      {tab === "identity" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" defaultValue={venue.description ?? ""} />
          </div>
          <div>
            <Label htmlFor="coverImageUrl">URL imagen portada</Label>
            <Input id="coverImageUrl" name="coverImageUrl" defaultValue={venue.coverImageUrl ?? ""} />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" defaultValue={venue.city ?? ""} />
          </div>
          <div>
            <Label>Tipo de establecimiento</Label>
            <CheckboxGroup name="establishmentTypes" options={ESTABLISHMENT_TYPES} selected={venue.establishmentTypes} />
          </div>
          <div>
            <Label>Tipos de cocina</Label>
            <CheckboxGroup name="cuisineTypes" options={CUISINE_TYPES} selected={venue.cuisineTypes} />
          </div>
          <div>
            <Label htmlFor="signatureDishes">Platos estrella (máx. 5, separados por coma)</Label>
            <Input
              id="signatureDishes"
              name="signatureDishes"
              defaultValue={venue.signatureDishes.join(", ")}
            />
          </div>
        </div>
      )}

      {tab === "ambience" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="neighborhood">Barrio / zona</Label>
            <Input id="neighborhood" name="neighborhood" defaultValue={venue.neighborhood ?? ""} placeholder="Barrio de las Letras" />
          </div>
          <div>
            <Label>Ideal para</Label>
            <CheckboxGroup name="idealFor" options={IDEAL_FOR} selected={venue.idealFor} />
          </div>
          <div>
            <Label>Características del local</Label>
            <CheckboxGroup name="venueFeatures" options={VENUE_FEATURES} selected={venue.venueFeatures} />
          </div>
        </div>
      )}

      {tab === "pricing" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="averageTicketRange">Ticket medio</Label>
            <select
              id="averageTicketRange"
              name="averageTicketRange"
              defaultValue={venue.averageTicketRange ?? ""}
              className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            >
              <option value="">Sin especificar</option>
              {AVERAGE_TICKET_RANGES.map((range) => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasDailyMenu" defaultChecked={venue.hasDailyMenu} />
            Menú del día / ofertas
          </label>
          <div>
            <Label htmlFor="dailyMenuDescription">Descripción oferta</Label>
            <Input id="dailyMenuDescription" name="dailyMenuDescription" defaultValue={venue.dailyMenuDescription ?? ""} />
          </div>
        </div>
      )}

      {tab === "awards" && (
        <div className="space-y-4">
          <div>
            <Label>Galardones y guías</Label>
            <CheckboxGroup name="awardBadges" options={AWARD_BADGES} selected={venue.awardBadges} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="michelinStars">Estrellas Michelin</Label>
              <Input id="michelinStars" name="michelinStars" type="number" min={1} max={3} defaultValue={venue.michelinStars ?? ""} />
            </div>
            <div>
              <Label htmlFor="fiftyBestRank">Ranking 50 Best</Label>
              <Input id="fiftyBestRank" name="fiftyBestRank" type="number" min={1} defaultValue={venue.fiftyBestRank ?? ""} />
            </div>
          </div>
        </div>
      )}

      {tab === "links" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="instagramUrl">Instagram (URL o @usuario)</Label>
            <Input id="instagramUrl" name="instagramUrl" defaultValue={venue.instagramUrl ?? ""} />
          </div>
          <div>
            <Label htmlFor="tiktokUrl">TikTok (URL o @usuario)</Label>
            <Input id="tiktokUrl" name="tiktokUrl" defaultValue={venue.tiktokUrl ?? ""} />
          </div>
          <div>
            <Label htmlFor="tripAdvisorUrl">TripAdvisor</Label>
            <Input id="tripAdvisorUrl" name="tripAdvisorUrl" defaultValue={venue.tripAdvisorUrl ?? ""} />
          </div>
          <div>
            <Label htmlFor="theForkUrl">TheFork</Label>
            <Input id="theForkUrl" name="theForkUrl" defaultValue={venue.theForkUrl ?? ""} />
          </div>
        </div>
      )}

      {tab === "preferences" && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="dressCode">Dress code</Label>
            <select
              id="dressCode"
              name="dressCode"
              defaultValue={venue.dressCode ?? ""}
              className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            >
              <option value="">Sin especificar</option>
              {DRESS_CODES.map((code) => (
                <option key={code.id} value={code.id}>{code.label}</option>
              ))}
            </select>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Preferencias e intolerancias</h4>
            <CheckboxGroup name="preferenceTags" options={PREFERENCE_DIETARY} selected={venue.preferenceTags} />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Accesibilidad</h4>
            <CheckboxGroup name="preferenceTags" options={PREFERENCE_ACCESSIBILITY} selected={venue.preferenceTags} />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Mascotas y niños</h4>
            <CheckboxGroup name="preferenceTags" options={PREFERENCE_PETS_KIDS} selected={venue.preferenceTags} />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Instalaciones</h4>
            <CheckboxGroup name="preferenceTags" options={PREFERENCE_FACILITIES} selected={venue.preferenceTags} />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Pagos</h4>
            <CheckboxGroup name="preferenceTags" options={PREFERENCE_PAYMENTS} selected={venue.preferenceTags} />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Eventos</h4>
            <CheckboxGroup name="preferenceTags" options={PREFERENCE_EVENTS} selected={venue.preferenceTags} />
          </div>
        </div>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
