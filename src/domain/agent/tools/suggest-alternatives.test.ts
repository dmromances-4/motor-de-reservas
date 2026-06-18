import { describe, expect, it, vi, beforeEach } from "vitest";
import { executeSuggestAlternatives } from "./suggest-alternatives";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    venue: { findUnique: vi.fn() },
  },
}));

vi.mock("@/domain/availability/fetch-context", () => ({
  buildAvailabilityInput: vi.fn(),
}));

vi.mock("@/domain/availability/engine", () => ({
  calculateSlots: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { buildAvailabilityInput } from "@/domain/availability/fetch-context";
import { calculateSlots } from "@/domain/availability/engine";

const ctx = {
  venueId: "venue-1",
  venueSlug: "demo",
  channel: "internal" as const,
};

describe("executeSuggestAlternatives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns alternatives within 30 minutes of preferred time", async () => {
    vi.mocked(prisma.venue.findUnique).mockResolvedValue({
      id: "venue-1",
      services: [],
    } as never);

    vi.mocked(buildAvailabilityInput).mockResolvedValue({
      date: "2026-06-13",
      partySize: 2,
      venue: { timezone: "Europe/Madrid" },
      service: { id: "svc-1", durationMinutes: 90, schedules: [] },
      existingReservations: [],
      blocks: [],
    } as never);

    const preferred = "2026-06-13T19:00:00.000Z";
    vi.mocked(calculateSlots).mockReturnValue([
      {
        dateTime: preferred,
        serviceId: "svc-1",
        availableCapacity: 4,
      },
      {
        dateTime: "2026-06-13T19:15:00.000Z",
        serviceId: "svc-1",
        availableCapacity: 4,
      },
      {
        dateTime: "2026-06-13T21:00:00.000Z",
        serviceId: "svc-1",
        availableCapacity: 4,
      },
    ]);

    const result = await executeSuggestAlternatives(ctx, {
      preferredDateTime: preferred,
      partySize: 2,
    });

    expect(result.success).toBe(true);
    expect(result.output?.exactMatch).toBe(true);
    expect(result.output?.alternatives).toHaveLength(2);
    expect(result.output?.alternatives.every((a) => a.minutesFromPreferred <= 30)).toBe(
      true,
    );
  });
});
