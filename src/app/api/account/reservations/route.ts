import { NextResponse } from "next/server";
import { requireDiner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireDiner();
    const reservations = await prisma.reservation.findMany({
      where: { dinerUserId: session.user.id },
      include: {
        venue: {
          select: { name: true, slug: true, city: true },
        },
        service: { select: { name: true } },
        review: { select: { id: true, rating: true } },
      },
      orderBy: { dateTime: "desc" },
    });
    return NextResponse.json({ reservations });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
