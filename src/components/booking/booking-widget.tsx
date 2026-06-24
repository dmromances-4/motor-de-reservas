"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils";
import { AgentChatPanel } from "@/components/booking/agent-chat-panel";

type PublicVenue = {
  id: string;
  slug: string;
  name: string;
  primaryColor: string;
  maxPartySize: number;
  timezone: string;
  agentChatEnabled?: boolean;
  services: Array<{ id: string; name: string; durationMinutes: number }>;
};

type Slot = { dateTime: string; availableCapacity: number };

const STEPS = ["Fecha", "Hora", "Datos", "Confirmación"];

function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const err = (data as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "formErrors" in err) {
    const formErrors = (err as { formErrors?: string[] }).formErrors;
    if (formErrors?.length) return formErrors.join(". ");
  }
  return fallback;
}

function buildReservationPayload(
  slug: string,
  serviceId: string,
  selectedSlot: string,
  partySize: number,
  form: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
    allergies: string;
    promoCode: string;
  },
  source: "WIDGET" | "MARKETPLACE",
) {
  return {
    slug,
    serviceId,
    dateTime: selectedSlot,
    partySize,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim() || undefined,
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    notes: form.notes.trim() || undefined,
    allergies: form.allergies.trim() || undefined,
    promoCode: form.promoCode.trim() || undefined,
    source,
  };
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="mb-2 flex items-center justify-between gap-1 text-xs">
      {STEPS.map((label, index) => {
        const n = index + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li
            key={label}
            className="flex flex-1 flex-col items-center gap-1"
            style={{ color: active || done ? "var(--ink)" : "var(--muted)" }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: active
                  ? "var(--teal-soft)"
                  : done
                    ? "var(--teal)"
                    : "var(--bg-2)",
                color: done ? "#fff" : "inherit",
              }}
            >
              {n}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function BookingWidget({
  slug,
  source = "WIDGET",
  depositAmountCents = 0,
  initialPromoCode = "",
}: {
  slug: string;
  source?: "WIDGET" | "MARKETPLACE";
  depositAmountCents?: number;
  initialPromoCode?: string;
}) {
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    code: string;
    dateTime: string;
  } | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    allergies: "",
    promoCode: "",
  });
  const [promoMessage, setPromoMessage] = useState("");

  useEffect(() => {
    fetch(`/api/venues/${slug}/public`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(
            r.status === 500
              ? "No se pudo cargar el restaurante. Comprueba que la base de datos esté en marcha."
              : "Restaurante no encontrado",
          );
        }
        return r.json() as Promise<{ venue?: PublicVenue }>;
      })
      .then((data) => {
        setVenue(data.venue ?? null);
        if (data.venue?.services?.[0]) {
          setServiceId(data.venue.services[0].id);
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el restaurante",
        );
      });
  }, [slug]);

  useEffect(() => {
    if (!initialPromoCode.trim()) return;
    const code = initialPromoCode.trim().toUpperCase();
    setForm((f) => ({ ...f, promoCode: code }));
    fetch(
      `/api/venues/${slug}/promo/validate?code=${encodeURIComponent(code)}&partySize=${partySize}`,
    )
      .then(async (r) => {
        if (!r.ok) throw new Error("validate failed");
        return r.json();
      })
      .then((data) => {
        if (data.ok) {
          setPromoMessage(
            `Promo aplicada: ${(data.discountCents / 100).toFixed(2)} € de descuento`,
          );
        } else {
          setPromoMessage(data.error ?? "Código no válido");
        }
      })
      .catch(() => setPromoMessage("No se pudo validar el código"));
  }, [initialPromoCode, slug, partySize]);

  async function loadSlots() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      slug,
      date,
      partySize: String(partySize),
      serviceId,
    });
    const res = await fetch(`/api/availability?${params}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error al cargar disponibilidad");
      return;
    }
    setSlots(data.slots ?? []);
    setStep(2);
  }

  async function submitReservation() {
    if (!selectedSlot) return;
    setLoading(true);
    setError("");

    const payload = buildReservationPayload(
      slug,
      serviceId,
      selectedSlot,
      partySize,
      form,
      source,
    );

    if (source === "MARKETPLACE" && depositAmountCents > 0) {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(
        data.error === "STRIPE_NOT_CONFIGURED"
          ? "Pagos no configurados. Contacta al restaurante."
          : formatApiError(data, "No se pudo iniciar el pago"),
      );
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No se recibió URL de pago");
      return;
    }

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(
        data.error === "SLOT_UNAVAILABLE"
          ? "Ese horario ya no está disponible. Elige otro."
          : formatApiError(data, "No se pudo completar la reserva"),
      );
      return;
    }
    setConfirmation({
      code: data.reservation.confirmationCode,
      dateTime: data.reservation.dateTime,
    });
    setStep(4);
  }

  if (!venue) {
    return (
      <div
        className="flex min-h-[400px] items-center justify-center"
        style={{ color: "var(--muted)" }}
      >
        Cargando...
      </div>
    );
  }

  function resetBooking() {
    setStep(1);
    setSelectedSlot(null);
    setSlots([]);
    setConfirmation(null);
    setError("");
    setPromoMessage("");
  }

  const accent = venue.primaryColor;
  const needsDeposit = source === "MARKETPLACE" && depositAmountCents > 0;

  return (
    <>
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader style={{ borderBottom: `3px solid ${accent}` }}>
        <CardTitle>{venue.name}</CardTitle>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Reserva tu mesa online
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <StepIndicator current={step} />
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Comensales</Label>
              <Input
                type="number"
                min={1}
                max={venue.maxPartySize}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Servicio</Label>
              <select
                className="flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                {venue.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="w-full"
              style={{ backgroundColor: accent }}
              disabled={!date || loading}
              onClick={loadSlots}
            >
              {loading ? "Cargando horarios…" : "Ver horarios"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text)" }}>
              Horarios disponibles para {partySize} comensales
            </p>
            {slots.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No hay disponibilidad.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.dateTime}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.dateTime);
                      setStep(3);
                    }}
                    className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-left text-sm transition-colors hover:border-[var(--teal)]"
                  >
                    <span className="block font-medium text-[var(--ink)]">
                      {formatTime(slot.dateTime, venue.timezone)}
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      {slot.availableCapacity} cubiertos
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" onClick={() => setStep(1)}>
              Volver
            </Button>
          </div>
        )}

        {step === 3 && selectedSlot && (
          <div className="space-y-4">
            <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
              {formatTime(selectedSlot, venue.timezone)} · {partySize}{" "}
              comensales
            </p>
            {needsDeposit && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Se requiere un depósito de{" "}
                {(depositAmountCents / 100).toFixed(2)} € para confirmar.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div>
              <Label>Código descuento</Label>
              <div className="flex gap-2">
                <Input
                  value={form.promoCode}
                  onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
                  placeholder="DEMO10"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!form.promoCode || !date}
                  onClick={async () => {
                    setPromoMessage("");
                    const res = await fetch(
                      `/api/venues/${slug}/promo/validate?code=${encodeURIComponent(form.promoCode)}&partySize=${partySize}&date=${date}`,
                    );
                    const data = await res.json();
                    if (data.ok) {
                      setPromoMessage(
                        `Descuento estimado: ${(data.discountCents / 100).toFixed(2)} €`,
                      );
                    } else {
                      setPromoMessage(data.error ?? "Código no válido");
                    }
                  }}
                >
                  Validar
                </Button>
              </div>
              {promoMessage && (
                <p className="mt-1 text-xs" style={{ color: "var(--text)" }}>
                  {promoMessage}
                </p>
              )}
            </div>
            <Button
              className="w-full"
              style={{ backgroundColor: accent }}
              disabled={loading || !form.firstName || !form.email}
              onClick={submitReservation}
            >
              {loading
                ? "Confirmando…"
                : needsDeposit
                  ? "Pagar depósito y reservar"
                  : "Confirmar reserva"}
            </Button>
            <Button variant="outline" onClick={() => setStep(2)}>
              Volver
            </Button>
          </div>
        )}

        {step === 4 && confirmation && (
          <div className="space-y-4 text-center">
            <p className="font-display text-lg font-semibold text-emerald-600">
              ¡Reserva confirmada!
            </p>
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--bg-2)" }}
            >
              <p style={{ color: "var(--ink)" }}>
                {formatDate(confirmation.dateTime, venue.timezone)} ·{" "}
                {formatTime(confirmation.dateTime, venue.timezone)}
              </p>
              <p className="mt-1" style={{ color: "var(--text)" }}>
                {partySize} comensales
              </p>
              <p className="mt-2 font-medium" style={{ color: "var(--ink)" }}>
                Código: {confirmation.code}
              </p>
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Guarda el código. El restaurante verá la reserva en el panel al
              seleccionar esta fecha.
            </p>
            <Button className="w-full" variant="outline" onClick={resetBooking}>
              Hacer otra reserva
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    {venue.agentChatEnabled && (
      <AgentChatPanel
        slug={venue.slug}
        venueName={venue.name}
        primaryColor={venue.primaryColor}
      />
    )}
  </>
  );
}
