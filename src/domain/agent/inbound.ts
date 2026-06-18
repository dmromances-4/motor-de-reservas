import { agentRateLimit } from "@/lib/rate-limit";
import { runAgentTurn } from "@/domain/agent/runtime";
import {
  resolveChannelIdentity,
  resolveOrCreateChannelConversation,
  resolveVenueBySlug,
} from "@/domain/agent/channel-service";
import { sendCampaignWhatsapp } from "@/domain/marketing/channels/whatsapp-channel";
import type { AgentChannel } from "@/domain/agent/types";

export type InboundAgentMessageInput = {
  venueSlug: string;
  channel: AgentChannel;
  message: string;
  externalId: string;
  conversationId?: string;
  phone?: string;
  replyViaWhatsapp?: boolean;
};

export async function handleInboundAgentMessage(
  input: InboundAgentMessageInput,
) {
  const venue = await resolveVenueBySlug(input.venueSlug);
  if (!venue) {
    throw new Error("VENUE_NOT_FOUND");
  }

  if (input.channel === "web" && !venue.agentChatEnabled) {
    throw new Error("AGENT_CHAT_DISABLED");
  }

  const limit = agentRateLimit(venue.id, input.channel);
  if (!limit.success) {
    throw new Error("RATE_LIMIT");
  }

  const identity = await resolveChannelIdentity({
    venueId: venue.id,
    channel: input.channel,
    externalId: input.externalId,
    phone: input.phone,
  });

  const conversation = await resolveOrCreateChannelConversation({
    venueId: venue.id,
    channel: input.channel,
    externalId: input.externalId,
    conversationId: input.conversationId,
    guestId: identity.guestId ?? undefined,
  });

  const result = await runAgentTurn({
    venueId: venue.id,
    venueSlug: venue.slug,
    venueName: venue.name,
    channel: input.channel,
    message: input.message,
    conversationId: conversation.id,
    externalId: input.externalId,
    guestId: identity.guestId ?? undefined,
    language: venue.language,
    timezone: venue.timezone,
  });

  if (input.replyViaWhatsapp && input.phone) {
    await sendCampaignWhatsapp({
      to: input.phone,
      body: result.reply.slice(0, 1500),
    });
  }

  return { ...result, remaining: limit.remaining };
}
