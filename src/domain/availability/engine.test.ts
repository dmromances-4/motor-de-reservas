import { describe, expect, it } from "vitest";
import {
  calculateSlots,
  getOccupancyAtSlot,
  parseTimeOnDate,
  rangesOverlap,
  validateSlotAvailable,
} from "./engine";
import type { AvailabilityInput } from "./types";

const baseInput = (): AvailabilityInput => ({
  date: "2026-06-10",
  partySize: 2,
  venue: {
    timezone: "Europe/Madrid",
    capacityMode: "simple",
    totalCapacity: 10,
    slotIntervalMinutes: 15,
    bufferMinutes: 15,
    maxPartySize: 8,
  },
  service: {
    id: "svc-1",
    durationMinutes: 90,
    schedules: [
      { dayOfWeek: 3, openTime: "20:00", closeTime: "23:00", isActive: true },
    ],
  },
  existingReservations: [],
  blocks: [],
});

describe("AvailabilityEngine", () => {
  it("returns empty when restaurant is closed", () => {
    const input = { ...baseInput(), isClosed: true };
    expect(calculateSlots(input)).toEqual([]);
  });

  it("returns empty when no schedule for day of week", () => {
    const input = {
      ...baseInput(),
      date: "2026-06-07",
      service: {
        ...baseInput().service,
        schedules: [
          { dayOfWeek: 1, openTime: "20:00", closeTime: "23:00", isActive: true },
        ],
      },
    };
    expect(calculateSlots(input)).toEqual([]);
  });

  it("returns empty when party size exceeds max", () => {
    const input = { ...baseInput(), partySize: 20 };
    expect(calculateSlots(input)).toEqual([]);
  });

  it("returns empty when party size is zero", () => {
    const input = { ...baseInput(), partySize: 0 };
    expect(calculateSlots(input)).toEqual([]);
  });

  it("generates slots within service hours", () => {
    const slots = calculateSlots(baseInput());
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].serviceId).toBe("svc-1");
    const times = slots.map((s) => s.dateTime);
    expect(times.some((t) => t.includes("T18:00:00") || t.includes("T20:00:00"))).toBe(
      true,
    );
  });

  it("respects 15 minute slot interval", () => {
    const slots = calculateSlots(baseInput());
    if (slots.length >= 2) {
      const a = new Date(slots[0].dateTime).getTime();
      const b = new Date(slots[1].dateTime).getTime();
      expect(b - a).toBe(15 * 60 * 1000);
    }
  });

  it("blocks slot when capacity is full", () => {
    const slotTime = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const input: AvailabilityInput = {
      ...baseInput(),
      existingReservations: [
        {
          dateTime: slotTime,
          partySize: 10,
          durationMinutes: 90,
          status: "CONFIRMED",
        },
      ],
    };
    const slots = calculateSlots(input);
    const blocked = slots.find((s) => s.dateTime === slotTime.toISOString());
    expect(blocked).toBeUndefined();
  });

  it("ignores cancelled reservations for occupancy", () => {
    const slotTime = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const input: AvailabilityInput = {
      ...baseInput(),
      existingReservations: [
        {
          dateTime: slotTime,
          partySize: 10,
          durationMinutes: 90,
          status: "CANCELLED",
        },
      ],
    };
    const slots = calculateSlots(input);
    expect(slots.some((s) => s.dateTime === slotTime.toISOString())).toBe(true);
  });

  it("applies buffer between reservations", () => {
    const slotTime = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const input: AvailabilityInput = {
      ...baseInput(),
      existingReservations: [
        {
          dateTime: slotTime,
          partySize: 6,
          durationMinutes: 90,
          status: "CONFIRMED",
        },
      ],
    };
    const slots = calculateSlots(input);
    const remainingCapacity = slots.find(
      (s) => s.dateTime === slotTime.toISOString(),
    )?.availableCapacity;
    expect(remainingCapacity).toBe(4);
  });

  it("blocks slots during availability block", () => {
    const blockStart = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const blockEnd = parseTimeOnDate("2026-06-10", "21:00", "Europe/Madrid");
    const input: AvailabilityInput = {
      ...baseInput(),
      blocks: [{ startTime: blockStart, endTime: blockEnd }],
    };
    const slots = calculateSlots(input);
    const inBlock = slots.filter((s) => {
      const t = new Date(s.dateTime).getTime();
      return t >= blockStart.getTime() && t < blockEnd.getTime();
    });
    expect(inBlock.length).toBe(0);
  });

  it("parseTimeOnDate handles Europe/Madrid timezone", () => {
    const dt = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    expect(dt.toISOString()).toBeTruthy();
    expect(dt.getUTCHours()).toBe(18);
  });

  it("last slot respects duration before close", () => {
    const input = baseInput();
    const slots = calculateSlots(input);
    const last = slots[slots.length - 1];
    const lastStart = new Date(last.dateTime);
    const close = parseTimeOnDate("2026-06-10", "23:00", "Europe/Madrid");
    expect(
      lastStart.getTime() + input.service.durationMinutes * 60 * 1000,
    ).toBeLessThanOrEqual(close.getTime() + 1000);
  });

  it("validateSlotAvailable returns true for open slot", () => {
    const input = baseInput();
    const slots = calculateSlots(input);
    expect(validateSlotAvailable(input, slots[0].dateTime)).toBe(true);
  });

  it("validateSlotAvailable returns false for full slot", () => {
    const slotTime = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const input: AvailabilityInput = {
      ...baseInput(),
      existingReservations: [
        {
          dateTime: slotTime,
          partySize: 10,
          durationMinutes: 90,
          status: "CONFIRMED",
        },
      ],
    };
    expect(validateSlotAvailable(input, slotTime.toISOString())).toBe(false);
  });

  it("table mode assigns available table", () => {
    const input: AvailabilityInput = {
      ...baseInput(),
      venue: {
        ...baseInput().venue,
        capacityMode: "tables",
      },
      tables: [
        { id: "t1", minCapacity: 2, maxCapacity: 4, status: "FREE" },
        { id: "t2", minCapacity: 4, maxCapacity: 6, status: "BLOCKED" },
      ],
    };
    const slots = calculateSlots(input);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].tableIds).toEqual(["t1"]);
  });

  it("table mode avoids already reserved table", () => {
    const slotTime = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const input: AvailabilityInput = {
      ...baseInput(),
      venue: {
        ...baseInput().venue,
        capacityMode: "tables",
      },
      tables: [
        { id: "t1", minCapacity: 2, maxCapacity: 4, status: "FREE" },
        { id: "t2", minCapacity: 2, maxCapacity: 4, status: "FREE" },
      ],
      existingReservations: [
        {
          dateTime: slotTime,
          partySize: 2,
          durationMinutes: 90,
          status: "CONFIRMED",
          tableIds: ["t1"],
        },
      ],
    };
    const slots = calculateSlots(input);
    const slot = slots.find((s) => s.dateTime === slotTime.toISOString());
    expect(slot?.tableIds).toEqual(["t2"]);
  });

  it("rangesOverlap detects overlapping intervals", () => {
    const a = {
      start: new Date("2026-06-10T20:00:00Z"),
      end: new Date("2026-06-10T22:00:00Z"),
    };
    const b = {
      start: new Date("2026-06-10T21:00:00Z"),
      end: new Date("2026-06-10T23:00:00Z"),
    };
    expect(rangesOverlap(a, b)).toBe(true);
  });

  it("getOccupancyAtSlot sums active reservations", () => {
    const start = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const end = parseTimeOnDate("2026-06-10", "21:30", "Europe/Madrid");
    const occupancy = getOccupancyAtSlot(
      start,
      end,
      [
        {
          dateTime: start,
          partySize: 4,
          durationMinutes: 90,
          status: "CONFIRMED",
        },
        {
          dateTime: start,
          partySize: 3,
          durationMinutes: 90,
          status: "SEATED",
        },
      ],
      15,
    );
    expect(occupancy).toBe(7);
  });

  it("multiple reservations reduce remaining capacity", () => {
    const t1 = parseTimeOnDate("2026-06-10", "20:00", "Europe/Madrid");
    const t2 = parseTimeOnDate("2026-06-10", "20:15", "Europe/Madrid");
    const input: AvailabilityInput = {
      ...baseInput(),
      existingReservations: [
        {
          dateTime: t1,
          partySize: 4,
          durationMinutes: 90,
          status: "CONFIRMED",
        },
        {
          dateTime: t2,
          partySize: 4,
          durationMinutes: 90,
          status: "CONFIRMED",
        },
      ],
    };
    const slot = calculateSlots(input).find(
      (s) => s.dateTime === t1.toISOString(),
    );
    expect(slot?.availableCapacity).toBe(2);
  });
});
