import { describe, expect, it } from "vitest";
import { pickBestTable, scoreTableCandidate } from "./table-optimizer";

describe("scoreTableCandidate", () => {
  it("prefers exact capacity match", () => {
    expect(scoreTableCandidate(2, 2, false)).toBeGreaterThan(
      scoreTableCandidate(2, 4, false),
    );
  });

  it("penalizes oversized tables when walk-in history is heavy", () => {
    const normal = scoreTableCandidate(2, 4, false);
    const heavy = scoreTableCandidate(2, 4, true);
    expect(heavy).toBeLessThan(normal);
  });
});

describe("pickBestTable", () => {
  it("chooses table of 2 over table of 4 for party of 2", () => {
    const result = pickBestTable(
      [
        { id: "table-4", minCapacity: 2, maxCapacity: 4 },
        { id: "table-2", minCapacity: 1, maxCapacity: 2 },
      ],
      2,
      false,
    );

    expect(result?.tableIds).toEqual(["table-2"]);
    expect(result?.score).toBeGreaterThan(0);
    expect(result?.rationale).toContain("ajustada");
  });

  it("returns null when no candidates", () => {
    expect(pickBestTable([], 2, false)).toBeNull();
  });
});
