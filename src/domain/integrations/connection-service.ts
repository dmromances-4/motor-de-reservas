import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type IntegrationProvider =
  | "google_business"
  | "google_reserve"
  | "opentable"
  | "thefork"
  | "instagram"
  | string;

export async function getIntegrationConnection(
  venueId: string,
  provider: IntegrationProvider,
) {
  return prisma.integrationConnection.findUnique({
    where: { venueId_provider: { venueId, provider } },
  });
}

export async function listIntegrationConnections(venueId: string) {
  return prisma.integrationConnection.findMany({
    where: { venueId },
    orderBy: { provider: "asc" },
  });
}

export async function connectIntegration(
  venueId: string,
  provider: IntegrationProvider,
  data: {
    credentials?: Record<string, unknown>;
    externalId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return prisma.integrationConnection.upsert({
    where: { venueId_provider: { venueId, provider } },
    create: {
      venueId,
      provider,
      status: "CONNECTED",
      credentials: (data.credentials ?? {}) as Prisma.InputJsonValue,
      externalId: data.externalId,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    },
    update: {
      status: "CONNECTED",
      credentials: (data.credentials ?? {}) as Prisma.InputJsonValue,
      externalId: data.externalId,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    },
  });
}

export async function disconnectIntegration(
  venueId: string,
  provider: IntegrationProvider,
) {
  return prisma.integrationConnection.updateMany({
    where: { venueId, provider },
    data: {
      status: "DISCONNECTED",
      credentials: {} as Prisma.InputJsonValue,
      externalId: null,
      metadata: {} as Prisma.InputJsonValue,
      lastSyncAt: null,
    },
  });
}

export async function markIntegrationSynced(
  venueId: string,
  provider: IntegrationProvider,
  metadata?: Record<string, unknown>,
) {
  return prisma.integrationConnection.update({
    where: { venueId_provider: { venueId, provider } },
    data: {
      lastSyncAt: new Date(),
      ...(metadata
        ? { metadata: metadata as Prisma.InputJsonValue }
        : {}),
    },
  });
}
