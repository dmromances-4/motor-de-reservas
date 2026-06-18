import { describe, expect, it } from "vitest";
import { buildSegmentWhere } from "./segment-service";

describe("buildSegmentWhere", () => {
  it("filters by tags and min visits", () => {
    const where = buildSegmentWhere("venue-1", {
      tags: ["vip"],
      minVisits: 2,
    });
    expect(where).toEqual({
      venueId: "venue-1",
      tags: { hasEvery: ["vip"] },
      visitCount: { gte: 2 },
    });
  });

  it("filters guests with email", () => {
    const where = buildSegmentWhere("venue-1", { hasEmail: true });
    expect(where.email).toEqual({ not: null });
  });

  it("filters guests with phone", () => {
    const where = buildSegmentWhere("venue-1", { hasPhone: true });
    expect(where.phone).toEqual({ not: null });
  });

  it("adds lastVisitWithinDays filter", () => {
    const where = buildSegmentWhere("venue-1", { lastVisitWithinDays: 30 });
    expect(where.lastVisitAt).toBeDefined();
    expect(where.lastVisitAt).toHaveProperty("gte");
  });
});
