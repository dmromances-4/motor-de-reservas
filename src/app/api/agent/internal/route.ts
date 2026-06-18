import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { agentRateLimit } from "@/lib/rate-limit";
import { runAgentTurn } from "@/domain/agent/runtime";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  venueSlug: z.string().min(1).optional(),
  conversationId: z.string().optional(),
  channel: z.enum(["internal", "web", "whatsapp", "instagram", "phone"]).default("internal"),
});

async function authorizeInternal(request: NextRequest) {
  const bearer = request.headers.get("authorization");
  const secret = process.env.AGENT_INTERNAL_SECRET;

  if (secret && bearer === `Bearer ${secret}`) {
    return { authorized: true as const, userId: "system" };
  }

  const session = await auth();
  if (!session?.user) {
    return { authorized: false as const, reason: "UNAUTHORIZED" };
  }

  if (session.user.accountType === "DINER") {
    return { authorized: false as const, reason: "DINER_NOT_ALLOWED" };
  }

  return { authorized: true as const, userId: session.user.id, session };
}

export async function POST(request: NextRequest) {
  const authResult = await authorizeInternal(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { message, conversationId, channel } = parsed.data;
  let venueSlug = parsed.data.venueSlug;

  if ("session" in authResult && authResult.session) {
    const memberships = authResult.session.user.memberships;
    if (!venueSlug) {
      venueSlug = memberships[0]?.venueSlug;
    } else if (
      !authResult.session.user.isSuperAdmin &&
      !memberships.some((m) => m.venueSlug === venueSlug)
    ) {
      return NextResponse.json({ error: "Venue access denied" }, { status: 403 });
    }
  }

  if (!venueSlug) {
    return NextResponse.json(
      { error: "venueSlug is required" },
      { status: 400 },
    );
  }

  const venue = await prisma.venue.findUnique({ where: { slug: venueSlug } });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const limit = agentRateLimit(venue.id, channel);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", remaining: limit.remaining },
      { status: 429 },
    );
  }

  try {
    const result = await runAgentTurn({
      venueId: venue.id,
      venueSlug: venue.slug,
      venueName: venue.name,
      channel,
      message,
      conversationId,
      language: venue.language,
      timezone: venue.timezone,
    });

    return NextResponse.json({
      ...result,
      remaining: limit.remaining,
    });
  } catch (error) {
    console.error("[agent/internal]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Agent error",
      },
      { status: 500 },
    );
  }
}
