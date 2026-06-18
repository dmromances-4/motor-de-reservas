import { describe, expect, it } from "vitest";
import { extractPendingIntentFromTool } from "@/domain/agent/pending-intent";

describe("extractPendingIntentFromTool", () => {
  it("extracts partySize and date from availability.check", () => {
    const patch = extractPendingIntentFromTool("availability.check", {
      partySize: 2,
      date: "2026-06-13",
    });
    expect(patch).toEqual({ partySize: 2, date: "2026-06-13" });
  });

  it("extracts datetime fields from suggestAlternatives", () => {
    const patch = extractPendingIntentFromTool(
      "availability.suggestAlternatives",
      {
        partySize: 4,
        preferredDateTime: "2026-06-13T21:00:00",
      },
    );
    expect(patch).toEqual({
      partySize: 4,
      preferredDateTime: "2026-06-13T21:00:00",
      date: "2026-06-13",
      time: "21:00",
    });
  });

  it("extracts reservation.create fields", () => {
    const patch = extractPendingIntentFromTool("reservation.create", {
      partySize: 3,
      dateTime: "2026-06-14T20:30:00",
      serviceId: "svc-1",
    });
    expect(patch).toEqual({
      partySize: 3,
      preferredDateTime: "2026-06-14T20:30:00",
      date: "2026-06-14",
      time: "20:30",
      serviceId: "svc-1",
    });
  });

  it("returns empty for unknown tools", () => {
    expect(extractPendingIntentFromTool("table.optimizeAssignment", {})).toEqual(
      {},
    );
  });
});
