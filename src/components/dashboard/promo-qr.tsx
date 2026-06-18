"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { generatePromoQrDataUrl } from "@/app/actions/marketing";

export function PromoQr({
  promoId,
  code,
}: {
  promoId: string;
  code: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    generatePromoQrDataUrl(promoId).then((res) => {
      if (res.ok) setDataUrl(res.dataUrl);
      else setError(res.error ?? "Error al generar QR");
    });
  }, [promoId]);

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `promo-${code}.png`;
    a.click();
  }

  if (error) {
    return <p className="text-xs text-red-600">{error}</p>;
  }

  if (!dataUrl) {
    return <p className="text-xs text-zinc-500">Generando QR…</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR ${code}`} className="h-24 w-24 rounded border" />
      <Button type="button" size="sm" variant="outline" onClick={downloadPng}>
        Descargar QR
      </Button>
    </div>
  );
}
