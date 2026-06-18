import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { availabilityQuerySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getAvailabilityBySlug } from "@/domain/reservations/service";
import { buildAvailabilityInput } from "@/domain/availability/fetch-context";
import { calculateSlots } from "@/domain/availability/engine";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = rateLimit(`availability:${ip}`);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = availabilityQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slug, venueId, date, partySize, serviceId } = parsed.data;

  if (slug) {
    const result = await getAvailabilityBySlug({ slug, date, partySize, serviceId });
    if (!result) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }
    return NextResponse.json({
      slots: result.slots,
      services: result.services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
      })),
    });
  }

  if (!venueId) {
    return NextResponse.json({ error: "slug or venueId required" }, { status: 400 });
  }

  const input = await buildAvailabilityInput({
    venueId,
    date,
    partySize,
    serviceId,
  });

  if (!input) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ slots: calculateSlots(input) });
}
