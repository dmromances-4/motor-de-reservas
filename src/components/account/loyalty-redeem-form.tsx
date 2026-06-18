"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
};

export function LoyaltyRedeemForm({
  rewards,
  points,
}: {
  rewards: Reward[];
  points: number;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function redeem(rewardId: string) {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/account/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage(`Canjeado. Código: ${data.redemption.code}`);
      window.location.reload();
    } else {
      setMessage(data.error ?? "Error al canjear");
    }
  }

  if (rewards.length === 0) {
    return <p className="text-sm text-zinc-500">No hay recompensas disponibles.</p>;
  }

  return (
    <div className="space-y-3">
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {rewards.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
        >
          <div>
            <p className="font-medium">{r.name}</p>
            {r.description && (
              <p className="text-sm text-zinc-500">{r.description}</p>
            )}
            <p className="text-xs text-zinc-500">{r.pointsCost} puntos</p>
          </div>
          <Button
            size="sm"
            disabled={loading || points < r.pointsCost}
            onClick={() => redeem(r.id)}
          >
            Canjear
          </Button>
        </div>
      ))}
    </div>
  );
}
