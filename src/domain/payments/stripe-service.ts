import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "./commission";
import { createMarketplaceReservation } from "@/domain/reservations/service";
import { getPlatformDiscountBps } from "@/domain/marketplace/loyalty-service";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export type CheckoutDraft = {
  slug: string;
  serviceId: string;
  dateTime: string;
  partySize: number;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  notes?: string;
  allergies?: string;
  dinerUserId?: string;
  promoCode?: string;
};

export async function createDepositCheckoutSession(draft: CheckoutDraft) {
  const stripe = getStripe();
  const venue = await prisma.venue.findUnique({
    where: { slug: draft.slug },
  });

  if (!venue || !venue.isListedOnMarketplace) {
    throw new Error("VENUE_NOT_FOUND");
  }

  let depositCents = venue.depositAmountCents;
  if (depositCents <= 0) {
    throw new Error("NO_DEPOSIT_REQUIRED");
  }

  if (draft.dinerUserId) {
    const diner = await prisma.user.findUnique({
      where: { id: draft.dinerUserId },
      select: { loyaltyPoints: true },
    });
    if (diner) {
      const tierBps = getPlatformDiscountBps(diner.loyaltyPoints);
      if (tierBps > 0) {
        const tierDiscount = Math.floor((depositCents * tierBps) / 10000);
        depositCents = Math.max(0, depositCents - tierDiscount);
      }
    }
  }

  if (depositCents <= 0) {
    throw new Error("NO_DEPOSIT_REQUIRED");
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: draft.email,
    line_items: [
      {
        price_data: {
          currency: venue.currency.toLowerCase(),
          unit_amount: depositCents,
          product_data: {
            name: `Depósito reserva — ${venue.name}`,
            description: `${draft.partySize} comensales · ${new Date(draft.dateTime).toLocaleString("es-ES")}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/account/reservations?payment=success`,
    cancel_url: `${baseUrl}/venues/${draft.slug}?payment=cancelled`,
    metadata: {
      slug: draft.slug,
      serviceId: draft.serviceId,
      dateTime: draft.dateTime,
      partySize: String(draft.partySize),
      firstName: draft.firstName,
      lastName: draft.lastName ?? "",
      email: draft.email,
      phone: draft.phone ?? "",
      notes: draft.notes ?? "",
      allergies: draft.allergies ?? "",
      dinerUserId: draft.dinerUserId ?? "",
      promoCode: draft.promoCode ?? "",
      depositAmountCents: String(depositCents),
      commissionBps: String(venue.marketplaceCommissionBps),
    },
  });

  return { url: session.url, sessionId: session.id };
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.metadata || session.payment_status !== "paid") {
    return null;
  }

  const meta = session.metadata;
  const existing = await prisma.paymentEvent.findUnique({
    where: { stripeEventId: session.id },
  });
  if (existing) return null;

  const depositAmountCents = Number(meta.depositAmountCents);
  const commissionBps = Number(meta.commissionBps);
  const commissionAmountCents = calculateCommission(depositAmountCents, commissionBps);

  const reservation = await createMarketplaceReservation({
    slug: meta.slug,
    serviceId: meta.serviceId,
    dateTime: meta.dateTime,
    partySize: Number(meta.partySize),
    firstName: meta.firstName,
    lastName: meta.lastName || undefined,
    email: meta.email,
    phone: meta.phone || undefined,
    notes: meta.notes || undefined,
    allergies: meta.allergies || undefined,
    dinerUserId: meta.dinerUserId || undefined,
    depositAmountCents,
    depositStatus: "PAID",
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    commissionAmountCents,
    promoCode: meta.promoCode || undefined,
  });

  await prisma.paymentEvent.create({
    data: {
      reservationId: reservation.id,
      stripeEventId: session.id,
      type: "checkout.session.completed",
      amountCents: depositAmountCents,
      status: "PAID",
      rawPayload: JSON.stringify({ sessionId: session.id }),
    },
  });

  return reservation;
}
