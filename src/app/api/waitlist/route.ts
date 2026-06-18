import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  let guest = await prisma.guest.findFirst({
    where: { venueId: venue.id, email: parsed.data.email },
  });

  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        venueId: venue.id,
        email: parsed.data.email,
        phone: parsed.data.phone,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      },
    });
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      venueId: venue.id,
      serviceId: parsed.data.serviceId,
      guestId: guest.id,
      date: new Date(`${parsed.data.date}T00:00:00`),
      partySize: parsed.data.partySize,
      preferredTime: parsed.data.preferredTime,
    },
  });

  return NextResponse.json({ waitlistEntry: entry });
}
