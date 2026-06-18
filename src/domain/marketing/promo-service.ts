import { prisma } from "@/lib/prisma";
import type { PromoType } from "@/generated/prisma/client";

export type PromoValidationResult =
  | {
      ok: true;
      promoCodeId: string;
      code: string;
      discountCents: number;
    }
  | { ok: false; error: string };

function estimateTicketCents(averageTicketRange: string | null): number {
  switch (averageTicketRange) {
    case "LT_15":
      return 1200;
    case "RANGE_15_30":
      return 2200;
    case "RANGE_30_50":
      return 4000;
    case "GT_50":
      return 7000;
    default:
      return 2500;
  }
}

export function calculateDiscountCents(
  type: PromoType,
  valuePercent: number | null,
  valueCents: number | null,
  baseCents: number,
): number {
  if (type === "PERCENT" && valuePercent) {
    return Math.round((baseCents * valuePercent) / 100);
  }
  if (type === "FIXED" && valueCents) {
    return Math.min(valueCents, baseCents);
  }
  return 0;
}

export async function validatePromo(params: {
  code: string;
  venueId: string;
  partySize: number;
  date: string;
}): Promise<PromoValidationResult> {
  const promo = await prisma.promoCode.findFirst({
    where: {
      venueId: params.venueId,
      code: params.code.toUpperCase(),
      isActive: true,
    },
    include: { venue: true },
  });

  if (!promo) return { ok: false, error: "Código no válido" };

  const at = new Date(params.date);
  if (at < promo.validFrom || at > promo.validTo) {
    return { ok: false, error: "Código fuera de vigencia" };
  }
  if (promo.minPartySize && params.partySize < promo.minPartySize) {
    return { ok: false, error: `Mínimo ${promo.minPartySize} comensales` };
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { ok: false, error: "Código agotado" };
  }

  const base = estimateTicketCents(promo.venue.averageTicketRange);
  const discountCents = calculateDiscountCents(
    promo.type,
    promo.valuePercent,
    promo.valueCents,
    base * params.partySize,
  );

  return {
    ok: true,
    promoCodeId: promo.id,
    code: promo.code,
    discountCents,
  };
}

export async function redeemPromo(
  promoCodeId: string,
  reservationId: string,
  guestId: string,
  discountCents: number,
) {
  await prisma.$transaction([
    prisma.promoRedemption.create({
      data: { promoCodeId, reservationId, guestId, discountCents },
    }),
    prisma.promoCode.update({
      where: { id: promoCodeId },
      data: { usedCount: { increment: 1 } },
    }),
    prisma.reservation.update({
      where: { id: reservationId },
      data: { promoCodeId, discountCents },
    }),
  ]);
}
