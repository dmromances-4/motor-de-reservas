"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireVenueAccess } from "@/lib/auth";
import { buildPromoBookUrl } from "@/lib/promo-qr";
import { sendCampaign } from "@/domain/marketing/campaign-service";
import type { CampaignChannel, PromoType } from "@/generated/prisma/client";

export async function createPromoCode(
  venueId: string,
  data: {
    code: string;
    type: PromoType;
    valuePercent?: number;
    valueCents?: number;
    minPartySize?: number;
    validFrom: string;
    validTo: string;
    maxUses?: number;
  },
) {
  await requireVenueAccess(venueId);
  await prisma.promoCode.create({
    data: {
      venueId,
      code: data.code.toUpperCase(),
      type: data.type,
      valuePercent: data.valuePercent,
      valueCents: data.valueCents,
      minPartySize: data.minPartySize,
      validFrom: new Date(data.validFrom),
      validTo: new Date(data.validTo),
      maxUses: data.maxUses,
    },
  });
  revalidatePath("/dashboard/promos");
}

export async function generatePromoQrDataUrl(promoId: string) {
  const promo = await prisma.promoCode.findUnique({
    where: { id: promoId },
    include: { venue: { select: { slug: true } } },
  });
  if (!promo) return { ok: false as const, error: "NOT_FOUND" };

  const url = buildPromoBookUrl(promo.venue.slug, promo.code);
  const dataUrl = await QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  return { ok: true as const, dataUrl, url };
}

export async function togglePromo(venueId: string, promoId: string, isActive: boolean) {
  await requireVenueAccess(venueId);
  await prisma.promoCode.update({
    where: { id: promoId, venueId },
    data: { isActive },
  });
  revalidatePath("/dashboard/promos");
}

export async function createCampaign(
  venueId: string,
  data: {
    name: string;
    channels: CampaignChannel[];
    segmentId?: string;
    promoCodeId?: string;
    subject?: string;
    bodyTemplate: string;
    scheduledAt?: string;
    sendNow?: boolean;
  },
) {
  await requireVenueAccess(venueId);
  const campaign = await prisma.campaign.create({
    data: {
      venueId,
      name: data.name,
      channels: data.channels,
      segmentId: data.segmentId,
      promoCodeId: data.promoCodeId,
      subject: data.subject,
      bodyTemplate: data.bodyTemplate,
      status: data.sendNow ? "SENDING" : data.scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
  });

  if (data.sendNow) {
    await sendCampaign(campaign.id);
  }

  revalidatePath("/dashboard/campaigns");
  return campaign.id;
}
