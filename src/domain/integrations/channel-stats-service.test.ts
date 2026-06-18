import { describe, expect, it } from "vitest";
import {
  aggregateChannelStats,
  emptyChannelStats,
  getChannelSummary,
} from "./channel-stats-service";

describe("aggregateChannelStats", () => {
  const now = new Date("2026-06-15T12:00:00");

  it("aggregates by source and period", () => {
    const stats = aggregateChannelStats(
      [
        { dateTime: new Date("2026-06-10"), partySize: 2, source: "WIDGET" },
        { dateTime: new Date("2026-06-12"), partySize: 4, source: "WIDGET" },
        { dateTime: new Date("2026-05-20"), partySize: 2, source: "WIDGET" },
        { dateTime: new Date("2026-06-08"), partySize: 3, source: "MARKETPLACE" },
      ],
      now,
    );

    expect(stats.WIDGET?.currentMonth).toEqual({
      reservations: 2,
      covers: 6,
    });
    expect(stats.WIDGET?.previousMonth).toEqual({
      reservations: 1,
      covers: 2,
    });
    expect(stats.MARKETPLACE?.currentMonth.covers).toBe(3);
  });

  it("returns zeroed stats from emptyChannelStats", () => {
    const empty = emptyChannelStats();
    expect(empty.currentMonth).toEqual({ reservations: 0, covers: 0 });
    expect(empty.yearToDate.covers).toBe(0);
  });

  it("summarizes current month across channels", () => {
    const stats = aggregateChannelStats(
      [
        { dateTime: new Date("2026-06-01"), partySize: 2, source: "WIDGET" },
        { dateTime: new Date("2026-06-02"), partySize: 3, source: "PHONE" },
      ],
      now,
    );
    expect(getChannelSummary(stats)).toEqual({
      reservations: 2,
      covers: 5,
    });
  });
});
