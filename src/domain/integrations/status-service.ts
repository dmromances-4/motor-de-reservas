import type { PosIntegration, Venue } from "@/generated/prisma/client";
import type { IntegrationDefinition } from "./catalog";

export type IntegrationStatus =
  | "CONNECTED"
  | "ACTIVE"
  | "AVAILABLE"
  | "ERROR"
  | "COMING_SOON";

export type IntegrationConnectionRow = {
  provider: string;
  status: string;
};

export type IntegrationStatusContext = {
  venue: Pick<
    Venue,
    | "instagramUrl"
    | "tripAdvisorUrl"
    | "theForkUrl"
    | "tiktokUrl"
    | "isListedOnMarketplace"
    | "slug"
  >;
  posIntegrations: PosIntegration[];
  connections?: IntegrationConnectionRow[];
  env?: {
    resend?: boolean;
    twilio?: boolean;
  };
};

export function resolveIntegrationStatus(
  integration: IntegrationDefinition,
  ctx: IntegrationStatusContext,
): IntegrationStatus {
  if (integration.posProvider) {
    const pos = ctx.posIntegrations.find(
      (p) => p.provider === integration.posProvider,
    );
    if (pos?.status === "CONNECTED") return "CONNECTED";
    if (pos?.status === "ERROR") return "ERROR";
    if (integration.connectable) return "AVAILABLE";
    return "COMING_SOON";
  }

  if (integration.alwaysAvailable) return "AVAILABLE";

  if (integration.connectionProvider) {
    const conn = ctx.connections?.find(
      (c) => c.provider === integration.connectionProvider,
    );
    if (conn?.status === "CONNECTED") return "CONNECTED";
    if (integration.connectable) return "AVAILABLE";
    return "COMING_SOON";
  }

  if (integration.profileField) {
    const value = ctx.venue[integration.profileField];
    if (integration.profileField === "isListedOnMarketplace") {
      return value ? "ACTIVE" : "COMING_SOON";
    }
    if (value) return "ACTIVE";
  }

  if (integration.envCheck === "resend" && ctx.env?.resend) return "ACTIVE";
  if (integration.envCheck === "twilio" && ctx.env?.twilio) return "ACTIVE";

  if (integration.href === "/dashboard/campaigns") return "AVAILABLE";

  return "COMING_SOON";
}

export const STATUS_LABELS: Record<IntegrationStatus, string> = {
  CONNECTED: "Conectada",
  ACTIVE: "Activa",
  AVAILABLE: "Disponible",
  ERROR: "Error",
  COMING_SOON: "Próximamente",
};
