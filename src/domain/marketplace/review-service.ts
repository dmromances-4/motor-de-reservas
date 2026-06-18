import { prisma } from "@/lib/prisma";
import { awardReviewPoints } from "@/domain/marketplace/loyalty-service";

export async function submitReview(
  reservationId: string,
  userId: string,
  rating: number,
  comment?: string,
) {
  if (rating < 1 || rating > 5) {
    throw new Error("INVALID_RATING");
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { review: true },
  });

  if (!reservation) throw new Error("NOT_FOUND");
  if (reservation.status !== "COMPLETED") throw new Error("NOT_COMPLETED");
  if (reservation.source !== "MARKETPLACE") throw new Error("NOT_MARKETPLACE");
  if (reservation.dinerUserId !== userId) throw new Error("FORBIDDEN");
  if (reservation.review) throw new Error("ALREADY_REVIEWED");

  const review = await prisma.review.create({
    data: {
      venueId: reservation.venueId,
      reservationId,
      userId,
      rating,
      comment,
    },
  });

  const stats = await prisma.review.aggregate({
    where: { venueId: reservation.venueId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.venue.update({
    where: { id: reservation.venueId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      reviewCount: stats._count,
    },
  });

  await awardReviewPoints(userId, reservationId);

  return review;
}
