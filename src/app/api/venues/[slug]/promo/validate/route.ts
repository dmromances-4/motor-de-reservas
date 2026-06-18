import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePromo } from "@/domain/marketing/promo-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const code = request.nextUrl.searchParams.get("code");
  const partySize = Number(request.nextUrl.searchParams.get("partySize") ?? "2");
  const date =
    request.nextUrl.searchParams.get("date") ??
    new Date().toISOString().slice(0, 10);

  if (!code) {
    return NextResponse.json({ ok: false, error: "Código requerido" }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) {
    return NextResponse.json({ ok: false, error: "Local no encontrado" }, { status: 404 });
  }

  const result = await validatePromo({
    code,
    venueId: venue.id,
    partySize,
    date,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error });
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    discountCents: result.discountCents,
  });
}
