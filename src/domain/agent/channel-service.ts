import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { AgentChannel } from "@/domain/agent/types";

export function redactPii(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.\w+/g, "[email]")
    .replace(/\+?\d[\d\s-]{8,}\d/g, "[tel]");
}

export async function resolveChannelIdentity(params: {
  venueId: string;
  channel: AgentChannel;
  externalId: string;
  phone?: string;
  firstName?: string;
}) {
  const existing = await prisma.channelIdentity.findUnique({
    where: {
      venueId_channel_externalId: {
        venueId: params.venueId,
        channel: params.channel,
        externalId: params.externalId,
      },
    },
  });

  if (existing) return existing;

  let guestId: string | undefined;
  if (params.phone) {
    const guest = await prisma.guest.findFirst({
      where: { venueId: params.venueId, phone: params.phone },
    });
    guestId = guest?.id;
  }

  return prisma.channelIdentity.create({
    data: {
      venueId: params.venueId,
      channel: params.channel,
      externalId: params.externalId,
      guestId,
    },
  });
}

export async function resolveOrCreateChannelConversation(params: {
  venueId: string;
  channel: AgentChannel;
  conversationId?: string;
  externalId?: string;
  guestId?: string;
}) {
  if (params.conversationId) {
    const byId = await prisma.agentConversation.findFirst({
      where: {
        id: params.conversationId,
        venueId: params.venueId,
        status: "active",
      },
    });
    if (byId) return byId;
  }

  if (params.externalId) {
    const byExternal = await prisma.agentConversation.findFirst({
      where: {
        venueId: params.venueId,
        channel: params.channel,
        externalId: params.externalId,
        status: "active",
      },
      orderBy: { updatedAt: "desc" },
    });
    if (byExternal) return byExternal;
  }

  return prisma.agentConversation.create({
    data: {
      venueId: params.venueId,
      channel: params.channel,
      externalId: params.externalId,
      guestId: params.guestId,
      status: "active",
      metadata: {},
    },
  });
}

export function hashExternalId(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export async function resolveVenueBySlug(slug: string) {
  return prisma.venue.findUnique({
    where: { slug, isActive: true },
  });
}
