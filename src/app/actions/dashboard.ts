"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireVenueAccess } from "@/lib/auth";
import { getActiveVenueId } from "@/lib/venue-context";
import type { AverageTicketRange, DressCode } from "@/generated/prisma/client";
import { normalizeSocialUrl } from "@/domain/venue/taxonomy";
import {
  venueAmbienceSchema,
  venueAwardsSchema,
  venueIdentitySchema,
  venueLinksSchema,
  venuePreferencesSchema,
  venuePricingSchema,
} from "@/lib/validations";
import { ZodError } from "zod";

export type UpdateVenueSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

function formatZodError(error: ZodError): string {
  return error.issues.map((i) => i.message).join(". ");
}

export async function setActiveVenue(venueId: string) {
  const { session } = await requireVenueAccess(venueId);
  if (
    !session.user.isSuperAdmin &&
    !session.user.memberships.some((m) => m.venueId === venueId)
  ) {
    throw new Error("FORBIDDEN");
  }
  const cookieStore = await cookies();
  cookieStore.set("activeVenueId", venueId, { path: "/" });
  revalidatePath("/dashboard");
}

export async function updateVenueSettings(data: {
  venueId: string;
  name?: string;
  address?: string;
  phone?: string;
  totalCapacity?: number;
  capacityMode?: string;
  maxPartySize?: number;
  bufferMinutes?: number;
  menuUrl?: string | null;
  cancellationHours?: number;
  primaryColor?: string;
  isListedOnMarketplace?: boolean;
  description?: string;
  coverImageUrl?: string;
  cuisineTypes?: string[];
  city?: string;
  averageTicketRange?: AverageTicketRange | null;
  depositAmountCents?: number;
  marketplaceCommissionBps?: number;
  establishmentTypes?: string[];
  signatureDishes?: string[];
  idealFor?: string[];
  venueFeatures?: string[];
  neighborhood?: string;
  hasDailyMenu?: boolean;
  dailyMenuDescription?: string;
  awardBadges?: string[];
  michelinStars?: number | null;
  fiftyBestRank?: number | null;
  instagramUrl?: string;
  tripAdvisorUrl?: string;
  theForkUrl?: string;
  tiktokUrl?: string;
  preferenceTags?: string[];
  dressCode?: DressCode | null;
  agentTableOptimizationEnabled?: boolean;
  agentChatEnabled?: boolean;
}): Promise<UpdateVenueSettingsResult> {
  await requireVenueAccess(data.venueId);

  try {
    if (
      data.establishmentTypes !== undefined ||
      data.cuisineTypes !== undefined ||
      data.signatureDishes !== undefined
    ) {
      venueIdentitySchema.parse({
        establishmentTypes: data.establishmentTypes ?? [],
        cuisineTypes: data.cuisineTypes ?? [],
        signatureDishes: data.signatureDishes ?? [],
      });
    }
    if (
      data.idealFor !== undefined ||
      data.venueFeatures !== undefined ||
      data.neighborhood !== undefined
    ) {
      venueAmbienceSchema.parse({
        idealFor: data.idealFor ?? [],
        venueFeatures: data.venueFeatures ?? [],
        neighborhood: data.neighborhood,
      });
    }
    if (
      data.averageTicketRange !== undefined ||
      data.hasDailyMenu !== undefined ||
      data.dailyMenuDescription !== undefined
    ) {
      venuePricingSchema.parse({
        averageTicketRange: data.averageTicketRange,
        hasDailyMenu: data.hasDailyMenu ?? false,
        dailyMenuDescription: data.dailyMenuDescription,
      });
    }
    if (
      data.awardBadges !== undefined ||
      data.michelinStars !== undefined ||
      data.fiftyBestRank !== undefined
    ) {
      venueAwardsSchema.parse({
        awardBadges: data.awardBadges ?? [],
        michelinStars: data.michelinStars,
        fiftyBestRank: data.fiftyBestRank,
      });
    }
    if (
      data.instagramUrl !== undefined ||
      data.tripAdvisorUrl !== undefined ||
      data.theForkUrl !== undefined ||
      data.tiktokUrl !== undefined
    ) {
      venueLinksSchema.parse({
        instagramUrl: data.instagramUrl,
        tripAdvisorUrl: data.tripAdvisorUrl ?? "",
        theForkUrl: data.theForkUrl ?? "",
        tiktokUrl: data.tiktokUrl,
      });
    }
    if (data.preferenceTags !== undefined || data.dressCode !== undefined) {
      venuePreferencesSchema.parse({
        preferenceTags: data.preferenceTags ?? [],
        dressCode: data.dressCode,
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: formatZodError(error) };
    }
    throw error;
  }

  await prisma.venue.update({
    where: { id: data.venueId },
    data: {
      name: data.name,
      address: data.address,
      phone: data.phone,
      totalCapacity: data.totalCapacity,
      capacityMode: data.capacityMode,
      maxPartySize: data.maxPartySize,
      bufferMinutes: data.bufferMinutes,
      menuUrl: data.menuUrl,
      cancellationHours: data.cancellationHours,
      primaryColor: data.primaryColor,
      isListedOnMarketplace: data.isListedOnMarketplace,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      cuisineTypes: data.cuisineTypes,
      city: data.city,
      averageTicketRange: data.averageTicketRange,
      depositAmountCents: data.depositAmountCents,
      marketplaceCommissionBps: data.marketplaceCommissionBps,
      establishmentTypes: data.establishmentTypes,
      signatureDishes: data.signatureDishes,
      idealFor: data.idealFor,
      venueFeatures: data.venueFeatures,
      neighborhood: data.neighborhood,
      hasDailyMenu: data.hasDailyMenu,
      dailyMenuDescription: data.dailyMenuDescription,
      awardBadges: data.awardBadges,
      michelinStars: data.michelinStars,
      fiftyBestRank: data.fiftyBestRank,
      instagramUrl: normalizeSocialUrl(data.instagramUrl, "instagram"),
      tripAdvisorUrl: data.tripAdvisorUrl || null,
      theForkUrl: data.theForkUrl || null,
      tiktokUrl: normalizeSocialUrl(data.tiktokUrl, "tiktok"),
      preferenceTags: data.preferenceTags,
      dressCode: data.dressCode,
      agentTableOptimizationEnabled: data.agentTableOptimizationEnabled,
      agentChatEnabled: data.agentChatEnabled,
    },
  });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function getDashboardData() {
  const venueId = await getActiveVenueId();
  if (!venueId) return null;

  await requireVenueAccess(venueId);

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: { services: { include: { schedules: true } } },
  });

  return venue;
}

export async function updateServiceSchedule(data: {
  venueId: string;
  serviceId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}) {
  await requireVenueAccess(data.venueId);

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, venueId: data.venueId },
  });
  if (!service) throw new Error("SERVICE_NOT_FOUND");

  await prisma.serviceSchedule.upsert({
    where: {
      serviceId_dayOfWeek: {
        serviceId: data.serviceId,
        dayOfWeek: data.dayOfWeek,
      },
    },
    create: {
      serviceId: data.serviceId,
      dayOfWeek: data.dayOfWeek,
      openTime: data.openTime,
      closeTime: data.closeTime,
      isActive: data.isActive,
    },
    update: {
      openTime: data.openTime,
      closeTime: data.closeTime,
      isActive: data.isActive,
    },
  });

  revalidatePath("/dashboard/settings");
}

export async function createManualReservation(data: {
  venueId: string;
  serviceId: string;
  dateTime: string;
  partySize: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  source: "PHONE" | "WALK_IN";
}) {
  await requireVenueAccess(data.venueId);

  const venue = await prisma.venue.findUnique({
    where: { id: data.venueId },
  });
  if (!venue) throw new Error("VENUE_NOT_FOUND");

  const { createReservation } = await import("@/domain/reservations/service");
  return createReservation({
    slug: venue.slug,
    serviceId: data.serviceId,
    dateTime: data.dateTime,
    partySize: data.partySize,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email ?? `${data.phone ?? "walkin"}@manual.local`,
    phone: data.phone,
    notes: data.notes,
    source: data.source,
  });
}
