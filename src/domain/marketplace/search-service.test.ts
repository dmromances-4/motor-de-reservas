import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    venue: { findMany: mockFindMany },
  },
}));

vi.mock("@/domain/availability/fetch-context", () => ({
  buildAvailabilityInput: vi.fn(),
}));

vi.mock("@/domain/availability/engine", () => ({
  calculateSlots: vi.fn(),
}));

import { searchVenues } from "./search-service";

const sampleVenues = [
  {
    id: "1",
    slug: "la-trattoria",
    name: "La Trattoria",
    city: "Madrid",
    cuisineTypes: ["ITALIAN"],
    averageTicketRange: "RANGE_15_30" as const,
    averageRating: 4.5,
    reviewCount: 10,
    coverImageUrl: null,
    description: "Pasta",
    depositAmountCents: 1000,
    awardBadges: ["MACARFI"],
    michelinStars: 2,
    fiftyBestRank: null,
  },
  {
    id: "2",
    slug: "sushi-zen",
    name: "Sushi Zen",
    city: "Madrid",
    cuisineTypes: ["JAPANESE"],
    averageTicketRange: "RANGE_30_50" as const,
    averageRating: 4.8,
    reviewCount: 5,
    coverImageUrl: null,
    description: "Sushi",
    depositAmountCents: 0,
    awardBadges: ["FIFTY_BEST"],
    michelinStars: null,
    fiftyBestRank: 15,
  },
];

describe("searchVenues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue(sampleVenues);
  });

  it("filters by city, cuisine and ticket range", async () => {
    await searchVenues({
      city: "Madrid",
      cuisine: "ITALIAN",
      averageTicketRange: "RANGE_15_30",
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isListedOnMarketplace: true,
          isActive: true,
          city: { equals: "Madrid", mode: "insensitive" },
          cuisineTypes: { has: "ITALIAN" },
          averageTicketRange: "RANGE_15_30",
        }),
        take: 200,
      }),
    );
  });

  it("returns mapped results without availability check", async () => {
    const results = await searchVenues({ city: "Madrid" });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      slug: "la-trattoria",
      name: "La Trattoria",
      depositAmountCents: 1000,
    });
  });

  it("lists only marketplace venues", async () => {
    await searchVenues({});

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isListedOnMarketplace: true,
        }),
      }),
    );
  });

  it("filters by award badge", async () => {
    await searchVenues({ guide: "MICHELIN" });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          awardBadges: { has: "MICHELIN" },
        }),
      }),
    );
  });

  it("filters by establishment type, ideal for, preference and dress code", async () => {
    await searchVenues({
      establishmentType: "RESTAURANT",
      idealFor: "ROMANTIC",
      preference: "vegetarian",
      dressCode: "SMART_CASUAL",
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          establishmentTypes: { has: "RESTAURANT" },
          idealFor: { has: "ROMANTIC" },
          preferenceTags: { has: "vegetarian" },
          dressCode: "SMART_CASUAL",
        }),
      }),
    );
  });
});
