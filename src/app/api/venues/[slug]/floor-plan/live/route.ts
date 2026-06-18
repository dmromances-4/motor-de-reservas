import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getLiveFloorPlan,
  tableDisplayStatus,
} from "@/domain/floor-plan/floor-plan-service";
import { formatTime } from "@/lib/utils";

async function resolveVenue(slugOrId: string) {
  return prisma.venue.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    select: { id: true, slug: true, timezone: true },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const venue = await resolveVenue(slug);
  if (!venue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = session.user.memberships.find(
    (m) => m.venueId === venue.id,
  );
  if (!membership && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { zones, date } = await getLiveFloorPlan(venue.id);
  const tz = venue.timezone ?? "Europe/Madrid";
  const now = new Date();

  return NextResponse.json({
    date,
    venueSlug: venue.slug,
    zones: zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      layoutWidth: zone.layoutWidth,
      layoutHeight: zone.layoutHeight,
      backgroundUrl: zone.backgroundUrl,
      tables: zone.tables.map((table) => {
        const active = table.reservations[0]?.reservation;
        return {
          id: table.id,
          name: table.name,
          posX: table.posX,
          posY: table.posY,
          width: table.width,
          height: table.height,
          displayStatus: tableDisplayStatus(table, now),
          reservation: active
            ? {
                id: active.id,
                guestName: `${active.guest.firstName} ${active.guest.lastName ?? ""}`.trim(),
                partySize: active.partySize,
                time: formatTime(active.dateTime, tz),
                status: active.status,
              }
            : undefined,
        };
      }),
    })),
  });
}
