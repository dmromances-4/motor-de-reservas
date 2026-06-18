import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleInboundAgentMessage } from "@/domain/agent/inbound";
import { createHash } from "crypto";

const bodySchema = z.object({
  slug: z.string().min(1),
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  sessionKey: z.string().max(64).optional(),
});

function sessionExternalId(slug: string, sessionKey?: string) {
  const key = sessionKey ?? "anonymous";
  return `web:${slug}:${createHash("sha256").update(key).digest("hex").slice(0, 16)}`;
}

export async function POST(request: NextRequest) {
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

  const { slug, message, conversationId, sessionKey } = parsed.data;

  try {
    const result = await handleInboundAgentMessage({
      venueSlug: slug,
      channel: "web",
      message,
      conversationId,
      externalId: sessionExternalId(slug, sessionKey),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent error";

    if (message === "VENUE_NOT_FOUND") {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }
    if (message === "AGENT_CHAT_DISABLED") {
      return NextResponse.json({ error: "Agent chat disabled" }, { status: 403 });
    }
    if (message === "RATE_LIMIT") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    console.error("[agent/chat]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
