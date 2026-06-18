"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireVenueAccess } from "@/lib/auth";
import type { SegmentFilters } from "@/domain/crm/segment-service";

export async function updateGuest(
  venueId: string,
  guestId: string,
  data: {
    notes?: string;
    allergies?: string;
    tags?: string[];
    marketingEmail?: boolean;
    marketingSms?: boolean;
    marketingWhatsapp?: boolean;
  },
) {
  await requireVenueAccess(venueId);
  await prisma.guest.update({
    where: { id: guestId, venueId },
    data,
  });
  revalidatePath(`/dashboard/guests/${guestId}`);
}

export async function addGuestNote(
  venueId: string,
  guestId: string,
  body: string,
  authorId?: string,
) {
  await requireVenueAccess(venueId);
  await prisma.guestNote.create({
    data: { guestId, body, authorId },
  });
  revalidatePath(`/dashboard/guests/${guestId}`);
}

export async function createSegment(
  venueId: string,
  name: string,
  filters: SegmentFilters,
) {
  await requireVenueAccess(venueId);
  await prisma.guestSegment.create({
    data: { venueId, name, filters },
  });
  revalidatePath("/dashboard/segments");
}

export async function deleteSegment(venueId: string, segmentId: string) {
  await requireVenueAccess(venueId);
  await prisma.guestSegment.delete({
    where: { id: segmentId, venueId },
  });
  revalidatePath("/dashboard/segments");
}
