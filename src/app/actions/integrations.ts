"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireVenueAccess } from "@/lib/auth";
import {
  connectIntegration,
  disconnectIntegration,
  type IntegrationProvider,
} from "@/domain/integrations/connection-service";
import { importFromPlaceId } from "@/domain/integrations/google-import-service";
import { connectPosIntegration } from "@/domain/pos/pos-service";
import { createSquareAdapter } from "@/domain/pos/square-adapter";
import { createHoldedAdapter } from "@/domain/pos/holded-adapter";
import type { PosCredentials } from "@/domain/pos/adapter";
import type { PosProvider } from "@/generated/prisma/client";

export async function connectPos(
  venueId: string,
  provider: PosProvider,
  credentials: PosCredentials,
) {
  await requireVenueAccess(venueId);
  await connectPosIntegration(
    venueId,
    provider,
    credentials,
    credentials.locationId,
  );
  revalidatePath("/dashboard/integrations");
}

export async function disconnectPos(venueId: string, provider: PosProvider) {
  await requireVenueAccess(venueId);
  await prisma.posIntegration.updateMany({
    where: { venueId, provider },
    data: {
      status: "DISCONNECTED",
      credentials: {},
      externalLocationId: null,
      lastSyncAt: null,
    },
  });
  revalidatePath("/dashboard/integrations");
}

export async function testPosConnection(venueId: string, provider: PosProvider) {
  await requireVenueAccess(venueId);
  const integration = await prisma.posIntegration.findUnique({
    where: { venueId_provider: { venueId, provider } },
  });
  if (!integration) return { ok: false, error: "NOT_CONNECTED" };

  const creds = integration.credentials as PosCredentials;
  const adapter =
    provider === "SQUARE"
      ? createSquareAdapter(creds)
      : createHoldedAdapter(creds);
  const ok = await adapter.testConnection();

  await prisma.posIntegration.update({
    where: { id: integration.id },
    data: { status: ok ? "CONNECTED" : "ERROR", lastSyncAt: ok ? new Date() : undefined },
  });
  revalidatePath("/dashboard/integrations");
  return { ok };
}

export async function connectChannelIntegration(
  venueId: string,
  provider: IntegrationProvider,
  data: { externalId?: string; apiKey?: string },
) {
  await requireVenueAccess(venueId);
  await connectIntegration(venueId, provider, {
    externalId: data.externalId,
    credentials: data.apiKey ? { apiKey: data.apiKey } : {},
  });
  revalidatePath("/dashboard/integrations");
  return { ok: true as const };
}

export async function disconnectChannelIntegration(
  venueId: string,
  provider: IntegrationProvider,
) {
  await requireVenueAccess(venueId);
  await disconnectIntegration(venueId, provider);
  revalidatePath("/dashboard/integrations");
  return { ok: true as const };
}

export async function connectGooglePlace(
  venueId: string,
  placeId: string,
) {
  await requireVenueAccess(venueId);
  try {
    await importFromPlaceId(venueId, placeId);
    revalidatePath("/dashboard/integrations");
    revalidatePath("/dashboard/settings");
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "IMPORT_FAILED",
    };
  }
}

export async function syncGoogleProfile(venueId: string) {
  await requireVenueAccess(venueId);
  const conn = await prisma.integrationConnection.findUnique({
    where: { venueId_provider: { venueId, provider: "google_business" } },
  });
  if (!conn?.externalId) {
    return { ok: false as const, error: "NOT_CONNECTED" };
  }
  return connectGooglePlace(venueId, conn.externalId);
}
