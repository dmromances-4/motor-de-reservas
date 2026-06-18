"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampaign } from "@/app/actions/marketing";

export function CampaignForm({
  venueId,
  segments,
  promos,
}: {
  venueId: string;
  segments: Array<{ id: string; name: string }>;
  promos: Array<{ id: string; code: string }>;
}) {
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const channels: Array<"EMAIL" | "SMS" | "WHATSAPP"> = [];
    if (form.get("ch_email") === "on") channels.push("EMAIL");
    if (form.get("ch_sms") === "on") channels.push("SMS");
    if (form.get("ch_wa") === "on") channels.push("WHATSAPP");

    await createCampaign(venueId, {
      name: String(form.get("name")),
      channels,
      segmentId: String(form.get("segmentId") || "") || undefined,
      promoCodeId: String(form.get("promoCodeId") || "") || undefined,
      subject: String(form.get("subject") || "") || undefined,
      bodyTemplate: String(form.get("bodyTemplate")),
      sendNow: form.get("sendNow") === "on",
      scheduledAt: String(form.get("scheduledAt") || "") || undefined,
    });
    setMessage("Campaña creada");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-zinc-200 p-4">
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <div>
        <Label>Nombre</Label>
        <Input name="name" required placeholder="Promo verano" />
      </div>
      <div>
        <Label>Segmento</Label>
        <select name="segmentId" className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm">
          <option value="">Todos los comensales</option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Código promo (opcional)</Label>
        <select name="promoCodeId" className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm">
          <option value="">Ninguno</option>
          {promos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ch_email" defaultChecked />
          Email
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ch_sms" />
          SMS
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ch_wa" />
          WhatsApp
        </label>
      </div>
      <div>
        <Label>Asunto (email)</Label>
        <Input name="subject" placeholder="Oferta especial en {{venueName}}" />
      </div>
      <div>
        <Label>Mensaje</Label>
        <textarea
          name="bodyTemplate"
          required
          rows={4}
          className="w-full rounded-md border border-zinc-300 p-3 text-sm"
          placeholder="Hola {{firstName}}, tenemos una oferta en {{venueName}}. Código: {{promoCode}}"
        />
      </div>
      <div>
        <Label>Programar (opcional)</Label>
        <Input name="scheduledAt" type="datetime-local" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendNow" />
        Enviar ahora
      </label>
      <Button type="submit">Crear campaña</Button>
    </form>
  );
}
