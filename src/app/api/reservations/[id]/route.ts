import { NextRequest, NextResponse } from "next/server";
import { updateReservationSchema } from "@/lib/validations";
import { requireVenueAccess } from "@/lib/auth";
import { updateReservation } from "@/domain/reservations/service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      guest: true,
      service: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      tables: { include: { table: true } },
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await requireVenueAccess(reservation.venueId);
    return NextResponse.json({ reservation });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { session } = await requireVenueAccess(existing.venueId);
    const updated = await updateReservation(
      id,
      existing.venueId,
      parsed.data,
      session.user.email,
    );
    return NextResponse.json({ reservation: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status = message === "SLOT_UNAVAILABLE" ? 409 : message === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
