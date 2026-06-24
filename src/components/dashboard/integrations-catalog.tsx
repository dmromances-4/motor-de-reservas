"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_ORDER,
  getIntegrationsByCategory,
  INTEGRATION_CATALOG,
  INTEGRATION_CATEGORIES,
  type IntegrationCategory,
  type IntegrationDefinition,
} from "@/domain/integrations/catalog";
import {
  emptyChannelStats,
  getStatsForIntegration,
  type ChannelStatsMap,
} from "@/domain/integrations/channel-stats-service";
import {
  resolveIntegrationStatus,
  type IntegrationStatusContext,
} from "@/domain/integrations/status-service";
import { IntegrationCard, type IntegrationCardData } from "./integration-card";
import { IntegrationConnectModal } from "./integration-connect-modal";
import { IntegrationChannelModal } from "./integration-channel-modal";
import { IntegrationsFilterBar } from "./integrations-filter-bar";

type PosIntegrationInfo = {
  provider: "SQUARE" | "HOLDED";
  status: string;
  lastSyncAt: string | null;
};

export function IntegrationsCatalog({
  venueId,
  venueSlug,
  statusContext,
  statsMap,
  posIntegrations,
  connections,
}: {
  venueId: string;
  venueSlug: string;
  statusContext: IntegrationStatusContext;
  statsMap: ChannelStatsMap;
  posIntegrations: PosIntegrationInfo[];
  connections: Array<{ provider: string; status: string }>;
}) {
  const [modalProvider, setModalProvider] = useState<"SQUARE" | "HOLDED" | null>(
    null,
  );
  const [channelModal, setChannelModal] = useState<{
    provider: string;
    title: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<IntegrationCategory | "all">(
    "booking_channels",
  );

  function resolveStats(def: IntegrationDefinition) {
    if (def.statsKey) {
      return getStatsForIntegration(def.statsKey, statsMap);
    }
    if (def.showStats) {
      return emptyChannelStats();
    }
    return null;
  }

  function enrich(def: IntegrationDefinition): IntegrationCardData {
    return {
      slug: def.slug,
      name: def.name,
      description: def.description,
      color: def.color,
      status: resolveIntegrationStatus(def, statusContext),
      connectable: def.connectable,
      posProvider: def.posProvider,
      href: def.href,
      logoPath: def.logoPath,
      profileField: Boolean(def.profileField),
      settingsTab: def.settingsTab,
      shareType: def.shareType,
      stats: resolveStats(def),
    };
  }

  function handleConfigure(slug: string) {
    if (slug === "square") setModalProvider("SQUARE");
    else if (slug === "holded") setModalProvider("HOLDED");
    else {
      const def = INTEGRATION_CATALOG.find((d) => d.slug === slug);
      if (def?.connectionProvider) {
        setChannelModal({ provider: def.connectionProvider, title: def.name });
      }
    }
  }

  const searchLower = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => {
      if (category !== "all" && cat !== category) return false;
      if (cat === "order_management") return !searchLower;
      const items = getIntegrationsByCategory(cat).filter((def) =>
        searchLower ? def.name.toLowerCase().includes(searchLower) : true,
      );
      return items.length > 0;
    });
  }, [category, searchLower]);

  const activePos =
    posIntegrations.find((p) => p.provider === modalProvider) ?? null;

  return (
    <>
      <IntegrationsFilterBar
        search={search}
        category={category}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
      />

      <div className="space-y-10">
        {filteredCategories.map((cat) => {
          const meta = INTEGRATION_CATEGORIES[cat];

          if (cat === "order_management") {
            if (searchLower) return null;
            return (
              <section key={cat}>
                <h3 className="text-lg font-semibold">{meta.title}</h3>
                <p className="mb-4 text-sm text-zinc-500">{meta.description}</p>
                <p className="rounded-lg border border-dashed border-zinc-200 p-6 text-sm text-zinc-500">
                  Próximamente — integraciones de pedidos online y delivery.
                </p>
              </section>
            );
          }

          const items = getIntegrationsByCategory(cat).filter((def) =>
            searchLower ? def.name.toLowerCase().includes(searchLower) : true,
          );

          if (items.length === 0) return null;

          return (
            <section key={cat}>
              <h3 className="text-lg font-semibold">{meta.title}</h3>
              {meta.description && (
                <p className="mb-4 text-sm text-zinc-500">{meta.description}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((def) => (
                  <IntegrationCard
                    key={def.slug}
                    integration={enrich(def)}
                    venueSlug={venueSlug}
                    onConfigure={def.connectable ? handleConfigure : undefined}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <IntegrationConnectModal
        venueId={venueId}
        open={modalProvider !== null}
        provider={modalProvider}
        integration={activePos}
        onClose={() => setModalProvider(null)}
      />

      <IntegrationChannelModal
        venueId={venueId}
        open={channelModal !== null}
        provider={channelModal?.provider ?? null}
        title={channelModal?.title ?? ""}
        connected={
          channelModal
            ? connections.some(
                (c) =>
                  c.provider === channelModal.provider &&
                  c.status === "CONNECTED",
              )
            : false
        }
        onClose={() => setChannelModal(null)}
      />
    </>
  );
}
