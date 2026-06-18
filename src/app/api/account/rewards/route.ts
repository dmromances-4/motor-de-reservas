import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redeemReward } from "@/domain/marketplace/loyalty-service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.accountType !== "DINER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [rewards, redemptions, transactions] = await Promise.all([
    prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.rewardRedemption.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { reward: true },
    }),
    prisma.loyaltyTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    points: session.user.loyaltyPoints,
    rewards,
    redemptions,
    transactions,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.accountType !== "DINER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const rewardId = body.rewardId as string;
  if (!rewardId) {
    return NextResponse.json({ error: "MISSING_REWARD" }, { status: 400 });
  }

  try {
    const redemption = await redeemReward(session.user.id, rewardId);
    return NextResponse.json({ ok: true, redemption });
  } catch (e) {
    const message = e instanceof Error ? e.message : "REDEEM_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
