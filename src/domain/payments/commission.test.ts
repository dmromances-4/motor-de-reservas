import { describe, expect, it } from "vitest";
import { calculateCommission } from "./commission";

describe("calculateCommission", () => {
  it("calculates 3% of deposit", () => {
    expect(calculateCommission(1000, 300)).toBe(30);
  });

  it("rounds to nearest cent", () => {
    expect(calculateCommission(999, 300)).toBe(30);
    expect(calculateCommission(333, 300)).toBe(10);
  });

  it("returns zero for zero deposit", () => {
    expect(calculateCommission(0, 300)).toBe(0);
  });

  it("handles custom bps", () => {
    expect(calculateCommission(2000, 250)).toBe(50);
  });
});
