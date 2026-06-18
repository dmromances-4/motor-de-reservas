import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;

  const venue = await prisma.venue.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      address: true,
      phone: true,
      timezone: true,
      primaryColor: true,
      logoUrl: true,
      maxPartySize: true,
      cancellationHours: true,
      depositRequired: true,
      agentChatEnabled: true,
      isListedOnMarketplace: true,
      cuisineTypes: true,
      averageTicketRange: true,
      city: true,
      services: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!venue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ venue });
}
