import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleCheckoutCompleted } from "@/domain/payments/stripe-service";
import { sendReservationNotification } from "@/domain/notifications/service";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reservation = await handleCheckoutCompleted(session);
    if (reservation) {
      await sendReservationNotification(reservation, "CONFIRMATION");
    }
  }

  return NextResponse.json({ received: true });
}
