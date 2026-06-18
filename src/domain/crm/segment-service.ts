import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type SegmentFilters = {
  tags?: string[];
  minVisits?: number;
  lastVisitWithinDays?: number;
  hasEmail?: boolean;
  hasPhone?: boolean;
};

export function buildSegmentWhere(
  venueId: string,
  filters: SegmentFilters,
): Prisma.GuestWhereInput {
  const where: Prisma.GuestWhereInput = { venueId };

  if (filters.tags?.length) {
    where.tags = { hasEvery: filters.tags };
  }
  if (filters.minVisits != null && filters.minVisits > 0) {
    where.visitCount = { gte: filters.minVisits };
  }
  if (filters.lastVisitWithinDays != null && filters.lastVisitWithinDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - filters.lastVisitWithinDays);
    where.lastVisitAt = { gte: since };
  }
  if (filters.hasEmail) {
    where.email = { not: null };
  }
  if (filters.hasPhone) {
    where.phone = { not: null };
  }

  return where;
}

export async function resolveSegmentGuests(
  segmentId: string,
  limit?: number,
) {
  const segment = await prisma.guestSegment.findUnique({
    where: { id: segmentId },
  });
  if (!segment) throw new Error("SEGMENT_NOT_FOUND");

  const filters = segment.filters as SegmentFilters;
  return prisma.guest.findMany({
    where: buildSegmentWhere(segment.venueId, filters),
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

export async function countSegmentGuests(segmentId: string) {
  const segment = await prisma.guestSegment.findUnique({
    where: { id: segmentId },
  });
  if (!segment) throw new Error("SEGMENT_NOT_FOUND");

  const filters = segment.filters as SegmentFilters;
  return prisma.guest.count({
    where: buildSegmentWhere(segment.venueId, filters),
  });
}
