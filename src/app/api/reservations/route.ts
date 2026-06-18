import { NextRequest, NextResponse } from "next/server";
import { createReservationSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { createReservation } from "@/domain/reservations/service";
import { sendReservationNotification } from "@/domain/notifications/service";
import { auth, requireVenueAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const venueId = request.nextUrl.searchParams.get("venueId");
    const date = request.nextUrl.searchParams.get("date");

    if (!venueId) {
      return NextResponse.json({ error: "venueId required" }, { status: 400 });
    }

    await requireVenueAccess(venueId);

    const where: {
      venueId: string;
      dateTime?: { gte: Date; lte: Date };
    } = { venueId };

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.dateTime = { gte: start, lte: end };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: { guest: true, service: true },
      orderBy: { dateTime: "asc" },
    });

    return NextResponse.json({ reservations });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = rateLimit(`reservation:${ip}`, 10);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const reservation = await createReservation({
      ...parsed.data,
      dinerUserId:
        session?.user?.accountType === "DINER" ? session.user.id : undefined,
    });
    await sendReservationNotification(reservation, "CONFIRMATION");

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        confirmationCode: reservation.confirmationCode,
        dateTime: reservation.dateTime,
        partySize: reservation.partySize,
        status: reservation.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status =
      message === "SLOT_UNAVAILABLE"
        ? 409
        : message === "VENUE_NOT_FOUND"
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
