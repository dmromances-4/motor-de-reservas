import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { handleInboundAgentMessage } from "@/domain/agent/inbound";

function verifyMetaSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature?.startsWith("sha256=") || !secret) return false;
  const expected = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
  const received = signature.slice("sha256=".length);
  try {
    const a = Buffer.from(received, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    verifyToken &&
    token === verifyToken &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

type MetaMessagingEvent = {
  sender?: { id?: string };
  message?: { text?: string };
};

export async function POST(request: NextRequest) {
  const venueSlug =
    request.nextUrl.searchParams.get("venueSlug") ??
    process.env.AGENT_INSTAGRAM_DEFAULT_VENUE_SLUG;

  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET ?? "";
  const signature = request.headers.get("x-hub-signature-256");

  if (appSecret && !verifyMetaSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  if (!venueSlug) {
    return NextResponse.json({ error: "venueSlug not configured" }, { status: 503 });
  }

  let payload: {
    entry?: Array<{
      messaging?: MetaMessagingEvent[];
    }>;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const replies: string[] = [];

  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const text = event.message?.text?.trim();
      if (!senderId || !text) continue;

      try {
        const result = await handleInboundAgentMessage({
          venueSlug,
          channel: "instagram",
          message: text,
          externalId: senderId,
        });
        replies.push(result.reply);
      } catch (error) {
        console.error("[agent/webhooks/instagram]", error);
      }
    }
  }

  return NextResponse.json({ ok: true, replies: replies.length });
}
