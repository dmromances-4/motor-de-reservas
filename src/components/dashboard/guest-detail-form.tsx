"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGuest, addGuestNote } from "@/app/actions/crm";

export function GuestDetailForm({
  venueId,
  guest,
}: {
  venueId: string;
  guest: {
    id: string;
    notes: string | null;
    allergies: string | null;
    tags: string[];
    marketingEmail: boolean;
    marketingSms: boolean;
    marketingWhatsapp: boolean;
  };
}) {
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await updateGuest(venueId, guest.id, {
      notes: String(form.get("notes") ?? ""),
      allergies: String(form.get("allergies") ?? ""),
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      marketingEmail: form.get("marketingEmail") === "on",
      marketingSms: form.get("marketingSms") === "on",
      marketingWhatsapp: form.get("marketingWhatsapp") === "on",
    });
    setMessage("Guardado");
  }

  async function onAddNote() {
    if (!note.trim()) return;
    await addGuestNote(venueId, guest.id, note.trim());
    setNote("");
    setMessage("Nota añadida");
  }

  return (
    <form onSubmit={onSave} className="space-y-4 rounded-xl border border-zinc-200 p-4">
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <div>
        <Label>Notas</Label>
        <Input name="notes" defaultValue={guest.notes ?? ""} />
      </div>
      <div>
        <Label>Alergias</Label>
        <Input name="allergies" defaultValue={guest.allergies ?? ""} />
      </div>
      <div>
        <Label>Tags (coma)</Label>
        <Input name="tags" defaultValue={guest.tags.join(", ")} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="marketingEmail" defaultChecked={guest.marketingEmail} />
          Email marketing
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="marketingSms" defaultChecked={guest.marketingSms} />
          SMS
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="marketingWhatsapp" defaultChecked={guest.marketingWhatsapp} />
          WhatsApp
        </label>
      </div>
      <Button type="submit">Guardar</Button>

      <div className="flex gap-2 border-t border-zinc-100 pt-4">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nueva nota interna..."
        />
        <Button type="button" variant="outline" onClick={onAddNote}>
          Añadir nota
        </Button>
      </div>
    </form>
  );
}
