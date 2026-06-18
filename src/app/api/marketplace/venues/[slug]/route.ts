import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceVenue } from "@/domain/marketplace/search-service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const venue = await getMarketplaceVenue(slug);
  if (!venue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ venue });
}
