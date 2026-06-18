import { describe, expect, it } from "vitest";
import { createSquareAdapter } from "./square-adapter";

describe("createSquareAdapter", () => {
  it("returns dev order id without credentials", async () => {
    const adapter = createSquareAdapter({});
    const id = await adapter.pushCompletedReservation({
      id: "res-1",
      partySize: 2,
      dateTime: new Date(),
      notes: "Mesa ventana",
      guest: {
        firstName: "Ana",
        lastName: "García",
        email: "ana@example.com",
        phone: null,
      },
      venue: { name: "Demo", currency: "EUR" },
    });
    expect(id).toBe("square-dev-res-1");
  });
});
