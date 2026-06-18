"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPromoCode } from "@/app/actions/marketing";

export function PromoForm({ venueId }: { venueId: string }) {
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const type = form.get("type") as "PERCENT" | "FIXED";
    await createPromoCode(venueId, {
      code: String(form.get("code")),
      type,
      valuePercent: type === "PERCENT" ? Number(form.get("valuePercent")) : undefined,
      valueCents: type === "FIXED" ? Number(form.get("valueCents")) : undefined,
      minPartySize: Number(form.get("minPartySize")) || undefined,
      validFrom: String(form.get("validFrom")),
      validTo: String(form.get("validTo")),
      maxUses: Number(form.get("maxUses")) || undefined,
    });
    setMessage("Código creado");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
      {message && <p className="text-sm text-emerald-700 sm:col-span-2">{message}</p>}
      <div>
        <Label>Código</Label>
        <Input name="code" required placeholder="DEMO10" />
      </div>
      <div>
        <Label>Tipo</Label>
        <select name="type" className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm">
          <option value="PERCENT">Porcentaje</option>
          <option value="FIXED">Importe fijo (céntimos)</option>
        </select>
      </div>
      <div>
        <Label>% descuento</Label>
        <Input name="valuePercent" type="number" min={1} max={100} placeholder="10" />
      </div>
      <div>
        <Label>Céntimos descuento</Label>
        <Input name="valueCents" type="number" min={1} placeholder="500" />
      </div>
      <div>
        <Label>Válido desde</Label>
        <Input name="validFrom" type="date" required />
      </div>
      <div>
        <Label>Válido hasta</Label>
        <Input name="validTo" type="date" required />
      </div>
      <div>
        <Label>Usos máximos</Label>
        <Input name="maxUses" type="number" min={1} />
      </div>
      <div>
        <Label>Party mínimo</Label>
        <Input name="minPartySize" type="number" min={1} />
      </div>
      <Button type="submit" className="sm:col-span-2">
        Crear código
      </Button>
    </form>
  );
}
