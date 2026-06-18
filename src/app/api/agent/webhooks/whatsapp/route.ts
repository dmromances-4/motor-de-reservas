import { NextRequest, NextResponse } from "next/server";
import {
  parseTwilioFormBody,
  validateTwilioSignature,
} from "@/lib/twilio-webhook";
import { handleInboundAgentMessage } from "@/domain/agent/inbound";

function twiml(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message></Response>`;
}

export async function POST(request: NextRequest) {
  const venueSlug =
    request.nextUrl.searchParams.get("venueSlug") ??
    process.env.AGENT_WHATSAPP_DEFAULT_VENUE_SLUG;

  if (!venueSlug) {
    return new NextResponse(twiml("Configuración de venue pendiente."), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const rawBody = await request.text();
  const params = parseTwilioFormBody(rawBody);
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature");

  if (authToken && signature) {
    const url = request.nextUrl.origin + request.nextUrl.pathname + request.nextUrl.search;
    if (!validateTwilioSignature(authToken, signature, url, params)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const from = params.From ?? "";
  const body = (params.Body ?? "").trim();
  if (!body) {
    return new NextResponse(twiml("Envía tu mensaje de reserva."), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const phone = from.replace(/^whatsapp:/, "");

  try {
    const result = await handleInboundAgentMessage({
      venueSlug,
      channel: "whatsapp",
      message: body,
      externalId: from,
      phone,
      replyViaWhatsapp: false,
    });

    return new NextResponse(twiml(result.reply.slice(0, 1500)), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[agent/webhooks/whatsapp]", error);
    const msg =
      error instanceof Error && error.message === "RATE_LIMIT"
        ? "Demasiados mensajes. Inténtalo en un momento."
        : "No pudimos procesar tu mensaje. Inténtalo más tarde.";
    return new NextResponse(twiml(msg), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
