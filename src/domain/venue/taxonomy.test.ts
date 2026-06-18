import { describe, expect, it } from "vitest";
import {
  MAX_SIGNATURE_DISHES,
  TAXONOMY_IDS,
  validateVenueTags,
  venueAwardsSchema,
  venueIdentitySchema,
  venueLinksSchema,
} from "./taxonomy";

describe("venue taxonomy", () => {
  it("validates allowed tags only", () => {
    const result = validateVenueTags(
      ["ITALIAN", "INVALID"],
      TAXONOMY_IDS.cuisineTypes,
    );
    expect(result).toEqual(["ITALIAN"]);
  });

  it("rejects more than max signature dishes", () => {
    const dishes = Array.from({ length: MAX_SIGNATURE_DISHES + 1 }, (_, i) =>
      `Plato ${i + 1}`,
    );
    const parsed = venueIdentitySchema.safeParse({
      establishmentTypes: [],
      cuisineTypes: [],
      signatureDishes: dishes,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid identity payload", () => {
    const parsed = venueIdentitySchema.safeParse({
      establishmentTypes: ["RESTAURANT"],
      cuisineTypes: ["ITALIAN"],
      signatureDishes: ["Risotto"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects michelinStars without MICHELIN badge", () => {
    const parsed = venueAwardsSchema.safeParse({
      awardBadges: ["MACARFI"],
      michelinStars: 2,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid links payload", () => {
    const parsed = venueLinksSchema.safeParse({
      instagramUrl: "@demo",
      tripAdvisorUrl: "",
      theForkUrl: "https://www.thefork.es/restaurant/demo",
    });
    expect(parsed.success).toBe(true);
  });
});
