"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSegment } from "@/app/actions/crm";

export function SegmentForm({ venueId }: { venueId: string }) {
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const tags = String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await createSegment(venueId, String(form.get("name")), {
      tags: tags.length ? tags : undefined,
      minVisits: Number(form.get("minVisits")) || undefined,
      hasEmail: form.get("hasEmail") === "on",
      hasPhone: form.get("hasPhone") === "on",
    });
    setMessage("Segmento creado");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
      {message && <p className="text-sm text-emerald-700 sm:col-span-2">{message}</p>}
      <div>
        <Label>Nombre</Label>
        <Input name="name" required placeholder="VIP" />
      </div>
      <div>
        <Label>Tags (coma)</Label>
        <Input name="tags" placeholder="vip, habitual" />
      </div>
      <div>
        <Label>Visitas mínimas</Label>
        <Input name="minVisits" type="number" min={0} defaultValue={1} />
      </div>
      <div className="flex flex-col gap-2 text-sm sm:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="hasEmail" defaultChecked />
          Con email
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="hasPhone" />
          Con teléfono
        </label>
      </div>
      <Button type="submit" className="sm:col-span-2">
        Crear segmento
      </Button>
    </form>
  );
}
