import { prisma } from "@/lib/prisma";
import { platformDiscountBps, tierForPoints } from "./loyalty-tiers";

const POINTS_PER_COMPLETED_MARKETPLACE = 100;
const SIGNUP_BONUS = 50;
const FIRST_RESERVATION_BONUS = 100;
const REVIEW_BONUS = 25;
const REFERRAL_BONUS = 75;

export async function earnPoints(
  userId: string,
  points: number,
  reason: string,
  reservationId?: string,
) {
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points } },
    });
    await tx.loyaltyTransaction.create({
      data: { userId, points, reason, reservationId },
    });
    return updated;
  });
  return user.loyaltyPoints;
}

export async function spendPoints(
  userId: string,
  points: number,
  reason: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.loyaltyPoints < points) {
    throw new Error("INSUFFICIENT_POINTS");
  }
  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: { userId, points: -points, reason },
    }),
  ]);
  return updated.loyaltyPoints;
}

export async function awardSignupBonus(userId: string) {
  const existing = await prisma.loyaltyTransaction.findFirst({
    where: { userId, reason: "signup" },
  });
  if (existing) return null;
  return earnPoints(userId, SIGNUP_BONUS, "signup");
}

export async function awardLoyaltyPoints(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (
    !reservation ||
    reservation.status !== "COMPLETED" ||
    reservation.source !== "MARKETPLACE" ||
    !reservation.dinerUserId ||
    reservation.loyaltyPointsAwarded
  ) {
    return null;
  }

  const priorCount = await prisma.reservation.count({
    where: {
      dinerUserId: reservation.dinerUserId,
      source: "MARKETPLACE",
      status: "COMPLETED",
      loyaltyPointsAwarded: true,
    },
  });

  let totalAwarded = POINTS_PER_COMPLETED_MARKETPLACE;
  const reasons = ["marketplace_visit"];

  if (priorCount === 0) {
    totalAwarded += FIRST_RESERVATION_BONUS;
    reasons.push("first_reservation");
  }

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: { loyaltyPointsAwarded: true },
    }),
    prisma.user.update({
      where: { id: reservation.dinerUserId },
      data: { loyaltyPoints: { increment: totalAwarded } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId: reservation.dinerUserId,
        points: totalAwarded,
        reason: reasons.join(","),
        reservationId,
      },
    }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: reservation.dinerUserId },
    select: { loyaltyPoints: true },
  });

  return {
    pointsAwarded: totalAwarded,
    totalPoints: user?.loyaltyPoints ?? 0,
  };
}

export async function awardReviewPoints(userId: string, reservationId: string) {
  const existing = await prisma.loyaltyTransaction.findFirst({
    where: { userId, reservationId, reason: "review" },
  });
  if (existing) return null;
  return earnPoints(userId, REVIEW_BONUS, "review", reservationId);
}

export async function processReferral(
  referrerCode: string,
  referredUserId: string,
) {
  const referrer = await prisma.user.findFirst({
    where: { referralCode: referrerCode },
  });
  if (!referrer || referrer.id === referredUserId) return null;

  const existing = await prisma.referral.findUnique({
    where: { referredUserId },
  });
  if (existing) return null;

  await prisma.$transaction([
    prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId,
        code: referrerCode,
        status: "REWARDED",
        rewardedAt: new Date(),
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId: referrer.id,
        points: REFERRAL_BONUS,
        reason: "referral",
      },
    }),
    prisma.user.update({
      where: { id: referrer.id },
      data: { loyaltyPoints: { increment: REFERRAL_BONUS } },
    }),
  ]);

  return { referrerId: referrer.id, points: REFERRAL_BONUS };
}

export async function redeemReward(userId: string, rewardId: string) {
  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, isActive: true },
  });
  if (!reward) throw new Error("REWARD_NOT_FOUND");

  await spendPoints(userId, reward.pointsCost, `redeem:${reward.id}`);

  const code = `RW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const redemption = await prisma.rewardRedemption.create({
    data: {
      userId,
      rewardId: reward.id,
      pointsSpent: reward.pointsCost,
      code,
    },
  });

  return redemption;
}

export async function loyaltyPointsForUser(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });
  return user?.loyaltyPoints ?? 0;
}

export function getTierForUser(points: number) {
  return tierForPoints(points);
}

export function getPlatformDiscountBps(points: number) {
  return platformDiscountBps(points);
}
