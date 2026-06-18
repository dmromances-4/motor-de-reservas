"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChannelPeriodStats } from "@/domain/integrations/channel-stats-service";
import type { IntegrationSettingsTab } from "@/domain/integrations/catalog";
import type { IntegrationStatus } from "@/domain/integrations/status-service";
import { STATUS_LABELS } from "@/domain/integrations/status-service";

export type IntegrationCardData = {
  slug: string;
  name: string;
  description: string;
  color: string;
  status: IntegrationStatus;
  connectable?: boolean;
  posProvider?: "SQUARE" | "HOLDED";
  href?: string;
  logoPath?: string;
  profileField?: boolean;
  settingsTab?: IntegrationSettingsTab;
  shareType?: "widget" | "marketplace";
  stats?: ChannelPeriodStats | null;
};

function statusVariant(
  status: IntegrationStatus,
): "success" | "secondary" | "warning" | "destructive" {
  if (status === "CONNECTED" || status === "ACTIVE" || status === "AVAILABLE") {
    return "success";
  }
  if (status === "ERROR") return "warning";
  return "secondary";
}

function statusBorder(status: IntegrationStatus): string {
  if (status === "CONNECTED" || status === "ACTIVE" || status === "AVAILABLE") {
    return "border-emerald-400 ring-1 ring-emerald-100";
  }
  if (status === "ERROR") return "border-amber-400";
  return "border-zinc-200";
}

export function IntegrationCard({
  integration,
  venueSlug,
  onConfigure,
}: {
  integration: IntegrationCardData;
  venueSlug: string;
  onConfigure?: (slug: string) => void;
}) {
  const { name, description, color, status, stats } = integration;
  const initial = name.charAt(0).toUpperCase();
  const [shareMsg, setShareMsg] = useState("");

  const hasActions =
    integration.connectable ||
    integration.href ||
    integration.profileField ||
    integration.shareType;

  async function handleShare() {
    const base =
      typeof window !== "undefined" ? window.location.origin : "";
    const path =
      integration.shareType === "widget"
        ? `/book/${venueSlug}`
        : `/venues/${venueSlug}`;
    const url = `${base}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg("Enlace copiado");
      setTimeout(() => setShareMsg(""), 2000);
    } catch {
      setShareMsg("No se pudo copiar");
    }
  }

  const settingsHref = integration.profileField
    ? `/dashboard/settings?tab=${integration.settingsTab ?? "links"}`
    : null;

  return (
    <div
      className={`flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm ${statusBorder(status)}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        {integration.logoPath ? (
          <Image
            src={integration.logoPath}
            alt={name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg"
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initial}
          </div>
        )}
        <Badge variant={statusVariant(status)} className="shrink-0 text-[10px]">
          {STATUS_LABELS[status]}
        </Badge>
      </div>

      <h3 className="font-semibold text-zinc-900">{name}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">
        {description}
      </p>

      {stats && (
        <div className="mt-3 grid grid-cols-3 gap-1 border-t border-zinc-100 pt-3 text-center text-[10px] text-zinc-500">
          <div>
            <p className="font-semibold text-zinc-800">
              {stats.currentMonth.covers}
            </p>
            <p>Este mes</p>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">
              {stats.previousMonth.covers}
            </p>
            <p>Mes ant.</p>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">
              {stats.yearToDate.covers}
            </p>
            <p>Total año</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {integration.connectable && onConfigure && (
          <Button
            size="sm"
            variant="default"
            onClick={() => onConfigure(integration.slug)}
          >
            Configurar
          </Button>
        )}
        {settingsHref && (
          <Button size="sm" variant="outline" asChild>
            <Link href={settingsHref}>Perfil</Link>
          </Button>
        )}
        {integration.shareType && (
          <Button size="sm" variant="outline" onClick={handleShare}>
            Compartir
          </Button>
        )}
        {integration.href && (
          <Button size="sm" variant="outline" asChild>
            <Link href={integration.href}>Abrir</Link>
          </Button>
        )}
        {!hasActions && (
          <Button size="sm" variant="outline" disabled>
            Más información
          </Button>
        )}
      </div>
      {shareMsg && (
        <p className="mt-1 text-[10px] text-emerald-700">{shareMsg}</p>
      )}
    </div>
  );
}
