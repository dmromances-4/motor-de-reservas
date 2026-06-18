import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const merchantId = payload.merchant_id as string | undefined;
  if (merchantId) {
    const integration = await prisma.posIntegration.findFirst({
      where: {
        provider: "SQUARE",
        status: "CONNECTED",
      },
    });
    if (integration) {
      await prisma.posSyncLog.create({
        data: {
          integrationId: integration.id,
          action: "webhook",
          status: "ok",
          payload,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
