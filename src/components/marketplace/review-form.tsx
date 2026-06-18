"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReviewForm({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/marketplace/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId, rating, comment }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al enviar reseña");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4">
      <p className="font-medium">Deja tu reseña</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <Label>Valoración (1-5)</Label>
        <Input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
      </div>
      <div>
        <Label>Comentario</Label>
        <Input value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading}>
        Publicar reseña
      </Button>
    </form>
  );
}
