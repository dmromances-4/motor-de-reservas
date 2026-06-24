import { describe, expect, it, vi, beforeEach } from "vitest";
import { executeReservationCreate } from "./reservation";

vi.mock("@/domain/reservations/service", () => ({
  createReservation: vi.fn(),
  updateReservation: vi.fn(),
}));

vi.mock("@/domain/notifications/service", () => ({
  sendReservationNotification: vi.fn(),
}));

vi.mock("@/domain/agent/table-optimizer", () => ({
  optimizeTableAssignment: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    venue: { findUnique: vi.fn() },
  },
}));

import { createReservation } from "@/domain/reservations/service";
import { sendReservationNotification } from "@/domain/notifications/service";
import { prisma } from "@/lib/prisma";

const ctx = {
  venueId: "venue-1",
  venueSlug: "la-trattoria",
  channel: "internal" as const,
  agentTableOptimizationEnabled: false,
};

describe("executeReservationCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates reservation and sends confirmation", async () => {
    vi.mocked(prisma.venue.findUnique).mockResolvedValue({
      id: "venue-1",
      depositRequired: false,
      capacityMode: "simple",
    } as never);

    vi.mocked(createReservation).mockResolvedValue({
      id: "res-1",
      confirmationCode: "ABC123",
      dateTime: new Date("2026-06-13T19:00:00.000Z"),
      partySize: 2,
      guest: { noShowCount: 0 },
    } as never);

    const result = await executeReservationCreate(ctx, {
      serviceId: "svc-1",
      dateTime: "2026-06-13T19:00:00.000Z",
      partySize: 2,
      firstName: "Ana",
      email: "ana@test.com",
    });

    expect(result.success).toBe(true);
    expect(result.output?.confirmationCode).toBe("ABC123");
    expect(sendReservationNotification).toHaveBeenCalledOnce();
  });

  it("surfaces SLOT_UNAVAILABLE errors", async () => {
    vi.mocked(prisma.venue.findUnique).mockResolvedValue({
      id: "venue-1",
      depositRequired: true,
      capacityMode: "simple",
    } as never);

    vi.mocked(createReservation).mockRejectedValue(new Error("SLOT_UNAVAILABLE"));

    const result = await executeReservationCreate(ctx, {
      serviceId: "svc-1",
      dateTime: "2026-06-13T19:00:00.000Z",
      partySize: 2,
      firstName: "Ana",
      email: "ana@test.com",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("SLOT_UNAVAILABLE");
  });
});
