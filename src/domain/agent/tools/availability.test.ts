import { describe, expect, it, vi, beforeEach } from "vitest";
import { executeAvailabilityCheck } from "./availability";

vi.mock("@/domain/reservations/service", () => ({
  getAvailabilityBySlug: vi.fn(),
}));

vi.mock("@/domain/agent/audit", () => ({
  logAgentAction: vi.fn(),
}));

import { getAvailabilityBySlug } from "@/domain/reservations/service";

const ctx = {
  venueId: "venue-1",
  venueSlug: "la-trattoria-demo",
  channel: "internal" as const,
};

describe("executeAvailabilityCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available slots from domain service", async () => {
    vi.mocked(getAvailabilityBySlug).mockResolvedValue({
      venue: {
        id: "venue-1",
        name: "La Trattoria Demo",
        slug: "la-trattoria-demo",
      } as never,
      services: [
        {
          id: "svc-1",
          name: "Cena",
          durationMinutes: 90,
        } as never,
      ],
      slots: [
        {
          dateTime: "2026-06-13T19:00:00.000Z",
          serviceId: "svc-1",
          availableCapacity: 4,
        },
      ],
    });

    const result = await executeAvailabilityCheck(ctx, {
      date: "2026-06-13",
      partySize: 2,
    });

    expect(result.success).toBe(true);
    expect(result.output?.slots).toHaveLength(1);
    expect(result.output?.slots[0].serviceName).toBe("Cena");
    expect(result.output?.message).toContain("1 hueco");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("filters slots below party size", async () => {
    vi.mocked(getAvailabilityBySlug).mockResolvedValue({
      venue: { name: "Demo" } as never,
      services: [{ id: "svc-1", name: "Cena", durationMinutes: 90 } as never],
      slots: [
        {
          dateTime: "2026-06-13T19:00:00.000Z",
          serviceId: "svc-1",
          availableCapacity: 2,
        },
      ],
    });

    const result = await executeAvailabilityCheck(ctx, {
      date: "2026-06-13",
      partySize: 4,
    });

    expect(result.success).toBe(true);
    expect(result.output?.slots).toHaveLength(0);
    expect(result.output?.message).toContain("No hay huecos");
  });

  it("returns error when venue not found", async () => {
    vi.mocked(getAvailabilityBySlug).mockResolvedValue(null);

    const result = await executeAvailabilityCheck(ctx, {
      date: "2026-06-13",
      partySize: 2,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("VENUE_NOT_FOUND");
  });
});
