import { prisma } from "@/lib/prisma";
import { resolveSegmentGuests } from "@/domain/crm/segment-service";
import { renderCampaignTemplate } from "./template";
import { sendCampaignEmail } from "./channels/email-channel";
import { sendCampaignSms } from "./channels/sms-channel";
import { sendCampaignWhatsapp } from "./channels/whatsapp-channel";
import type { CampaignChannel } from "@/generated/prisma/client";

export async function sendCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { venue: true, promoCode: true, segment: true },
  });
  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  const guests = campaign.segmentId
    ? await resolveSegmentGuests(campaign.segmentId)
    : await prisma.guest.findMany({
        where: { venueId: campaign.venueId },
      });

  let sent = 0;
  let failed = 0;

  for (const guest of guests) {
    const vars = {
      firstName: guest.firstName,
      venueName: campaign.venue.name,
      promoCode: campaign.promoCode?.code ?? "",
    };
    const body = renderCampaignTemplate(campaign.bodyTemplate, vars);

    for (const channel of campaign.channels) {
      if (channel === "EMAIL" && (!guest.email || !guest.marketingEmail)) continue;
      if (channel === "SMS" && (!guest.phone || !guest.marketingSms)) continue;
      if (channel === "WHATSAPP" && (!guest.phone || !guest.marketingWhatsapp))
        continue;

      const recipient =
        channel === "EMAIL" ? guest.email! : guest.phone!;

      const delivery = await prisma.campaignDelivery.create({
        data: {
          campaignId,
          guestId: guest.id,
          channel,
          recipient,
          status: "PENDING",
        },
      });

      try {
        let externalId: string | undefined;
        if (channel === "EMAIL") {
          const result = await sendCampaignEmail({
            to: recipient,
            subject:
              campaign.subject ??
              `Mensaje de ${campaign.venue.name}`,
            html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
          });
          externalId = result.externalId;
        } else if (channel === "SMS") {
          const result = await sendCampaignSms({ to: recipient, body });
          externalId = result.externalId;
        } else if (channel === "WHATSAPP") {
          const result = await sendCampaignWhatsapp({ to: recipient, body });
          externalId = result.externalId;
        }

        await prisma.campaignDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "SENT",
            externalId,
            sentAt: new Date(),
          },
        });
        sent++;
      } catch (e) {
        await prisma.campaignDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            error: e instanceof Error ? e.message : "Error",
          },
        });
        failed++;
      }
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: failed > 0 && sent === 0 ? "FAILED" : "SENT",
      sentAt: new Date(),
    },
  });

  return { sent, failed };
}

export async function processScheduledCampaigns() {
  const due = await prisma.campaign.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
  });

  for (const c of due) {
    await sendCampaign(c.id);
  }

  return due.length;
}
