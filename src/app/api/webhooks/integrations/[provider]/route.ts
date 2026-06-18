import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { createReservation } from "@/domain/reservations/service";
import type { ReservationSource } from "@/generated/prisma/client";

const PROVIDER_SOURCE: Record<string, ReservationSource> = {
  google_reserve: "GOOGLE",
  opentable: "OPENTABLE",
  thefork: "THEFORK",
  instagram: "INSTAGRAM",
};

function verifySignature(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = createHash("sha256")
    .update(`${secret}:${body}`)
    .digest("hex");
  return signature === expected;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const source = PROVIDER_SOURCE[provider];
  if (!source) {
    return NextResponse.json({ error: "UNKNOWN_PROVIDER" }, { status: 400 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-integration-signature");
  const secret = process.env.INTEGRATION_WEBHOOK_SECRET ?? "";

  if (secret && !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let payload: {
    venueSlug: string;
    serviceId?: string;
    dateTime: string;
    partySize: number;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    externalId?: string;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const venue = await prisma.venue.findFirst({
    where: { slug: payload.venueSlug, isActive: true },
    include: {
      services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!venue) {
    return NextResponse.json({ error: "VENUE_NOT_FOUND" }, { status: 404 });
  }

  const serviceId = payload.serviceId ?? venue.services[0]?.id;
  if (!serviceId) {
    return NextResponse.json({ error: "NO_SERVICE" }, { status: 400 });
  }

  try {
    const reservation = await createReservation({
      slug: venue.slug,
      serviceId,
      dateTime: payload.dateTime,
      partySize: payload.partySize,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email:
        payload.email ??
        `import+${payload.externalId ?? Date.now()}@${provider}.local`,
      phone: payload.phone,
      source,
      notes: payload.externalId
        ? `Importado desde ${provider}: ${payload.externalId}`
        : `Importado desde ${provider}`,
    });

    return NextResponse.json({
      ok: true,
      reservationId: reservation.id,
      confirmationCode: reservation.confirmationCode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "CREATE_FAILED";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
