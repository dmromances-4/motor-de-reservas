import { NextRequest, NextResponse } from "next/server";
import { requireDiner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireDiner();
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        venue: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            cuisineTypes: true,
            averageRating: true,
            coverImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ favorites });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireDiner();
    const { venueId } = await request.json();
    if (!venueId) {
      return NextResponse.json({ error: "venueId required" }, { status: 400 });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_venueId: {
          userId: session.user.id,
          venueId,
        },
      },
      create: { userId: session.user.id, venueId },
      update: {},
    });

    return NextResponse.json({ favorite });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireDiner();
    const venueId = request.nextUrl.searchParams.get("venueId");
    if (!venueId) {
      return NextResponse.json({ error: "venueId required" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: { userId: session.user.id, venueId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
