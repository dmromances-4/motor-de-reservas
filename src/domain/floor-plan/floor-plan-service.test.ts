import { describe, expect, it } from "vitest";
import { tableDisplayStatus } from "./floor-plan-service";

describe("tableDisplayStatus", () => {
  const now = new Date("2025-06-09T20:00:00");

  it("returns OCCUPIED when reservation is SEATED", () => {
    const status = tableDisplayStatus(
      {
        status: "FREE",
        reservations: [
          {
            reservation: {
              status: "SEATED",
              dateTime: new Date("2025-06-09T19:30:00"),
              durationMinutes: 90,
            },
          },
        ],
      },
      now,
    );
    expect(status).toBe("OCCUPIED");
  });

  it("returns RESERVED for confirmed reservation", () => {
    const status = tableDisplayStatus(
      {
        status: "FREE",
        reservations: [
          {
            reservation: {
              status: "CONFIRMED",
              dateTime: new Date("2025-06-09T20:15:00"),
              durationMinutes: 90,
            },
          },
        ],
      },
      now,
    );
    expect(status).toBe("RESERVED");
  });

  it("returns BLOCKED when table is blocked", () => {
    const status = tableDisplayStatus({
      status: "BLOCKED",
      reservations: [],
    });
    expect(status).toBe("BLOCKED");
  });

  it("returns FREE with no active reservations", () => {
    const status = tableDisplayStatus({
      status: "FREE",
      reservations: [],
    });
    expect(status).toBe("FREE");
  });
});
