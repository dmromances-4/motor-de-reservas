import { describe, expect, it } from "vitest";
import { calculateDiscountCents } from "./promo-service";

describe("calculateDiscountCents", () => {
  it("applies percent discount", () => {
    expect(calculateDiscountCents("PERCENT", 10, null, 5000)).toBe(500);
  });

  it("applies fixed discount capped at base", () => {
    expect(calculateDiscountCents("FIXED", null, 800, 500)).toBe(500);
    expect(calculateDiscountCents("FIXED", null, 300, 500)).toBe(300);
  });

  it("returns zero for invalid config", () => {
    expect(calculateDiscountCents("PERCENT", null, null, 5000)).toBe(0);
  });
});
