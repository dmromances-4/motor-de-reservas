import { NextRequest, NextResponse } from "next/server";
import { processScheduledCampaigns } from "@/domain/marketing/campaign-service";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    secret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processScheduledCampaigns();
  return NextResponse.json({ processed });
}
