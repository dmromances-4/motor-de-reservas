import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockFindUnique, mockCreate, mockAggregate, mockVenueUpdate, mockAwardReviewPoints } =
  vi.hoisted(() => ({
    mockFindUnique: vi.fn(),
    mockCreate: vi.fn(),
    mockAggregate: vi.fn(),
    mockVenueUpdate: vi.fn(),
    mockAwardReviewPoints: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reservation: { findUnique: mockFindUnique },
    review: { create: mockCreate, aggregate: mockAggregate },
    venue: { update: mockVenueUpdate },
  },
}));

vi.mock("./loyalty-service", () => ({
  awardReviewPoints: mockAwardReviewPoints,
}));

import { submitReview } from "./review-service";

describe("submitReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: 1 });
    mockCreate.mockResolvedValue({ id: "rev-1", rating: 5 });
    mockVenueUpdate.mockResolvedValue({});
    mockAwardReviewPoints.mockResolvedValue(25);
  });

  it("rejects invalid rating", async () => {
    await expect(submitReview("r1", "u1", 0)).rejects.toThrow("INVALID_RATING");
    await expect(submitReview("r1", "u1", 6)).rejects.toThrow("INVALID_RATING");
  });

  it("rejects if reservation not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(submitReview("r1", "u1", 5)).rejects.toThrow("NOT_FOUND");
  });

  it("rejects if not completed", async () => {
    mockFindUnique.mockResolvedValue({
      id: "r1",
      status: "CONFIRMED",
      source: "MARKETPLACE",
      dinerUserId: "u1",
      venueId: "venue-1",
      review: null,
    });
    await expect(submitReview("r1", "u1", 5)).rejects.toThrow("NOT_COMPLETED");
  });

  it("rejects if not marketplace source", async () => {
    mockFindUnique.mockResolvedValue({
      id: "r1",
      status: "COMPLETED",
      source: "WIDGET",
      dinerUserId: "u1",
      venueId: "venue-1",
      review: null,
    });
    await expect(submitReview("r1", "u1", 5)).rejects.toThrow("NOT_MARKETPLACE");
  });

  it("rejects if diner does not match", async () => {
    mockFindUnique.mockResolvedValue({
      id: "r1",
      status: "COMPLETED",
      source: "MARKETPLACE",
      dinerUserId: "other",
      venueId: "venue-1",
      review: null,
    });
    await expect(submitReview("r1", "u1", 5)).rejects.toThrow("FORBIDDEN");
  });

  it("rejects duplicate review", async () => {
    mockFindUnique.mockResolvedValue({
      id: "r1",
      status: "COMPLETED",
      source: "MARKETPLACE",
      dinerUserId: "u1",
      venueId: "venue-1",
      review: { id: "existing" },
    });
    await expect(submitReview("r1", "u1", 5)).rejects.toThrow("ALREADY_REVIEWED");
  });

  it("creates review and updates venue stats", async () => {
    mockFindUnique.mockResolvedValue({
      id: "r1",
      status: "COMPLETED",
      source: "MARKETPLACE",
      dinerUserId: "u1",
      venueId: "venue-1",
      review: null,
    });

    const review = await submitReview("r1", "u1", 5, "Great food");

    expect(review).toEqual({ id: "rev-1", rating: 5 });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        venueId: "venue-1",
        reservationId: "r1",
        userId: "u1",
        rating: 5,
        comment: "Great food",
      },
    });
    expect(mockVenueUpdate).toHaveBeenCalledWith({
      where: { id: "venue-1" },
      data: { averageRating: 4.5, reviewCount: 1 },
    });
    expect(mockAwardReviewPoints).toHaveBeenCalledWith("u1", "r1");
  });
});
