import { describe, expect, it } from "vitest";
import { redactPii } from "@/domain/agent/channel-service";

describe("redactPii", () => {
  it("redacts email addresses", () => {
    expect(redactPii("Mi email es juan@example.com gracias")).toBe(
      "Mi email es [email] gracias",
    );
  });

  it("redacts phone numbers", () => {
    expect(redactPii("Llámame al +34 612 345 678")).toBe(
      "Llámame al [tel]",
    );
  });

  it("leaves plain text unchanged", () => {
    expect(redactPii("Quiero mesa para 2 el viernes")).toBe(
      "Quiero mesa para 2 el viernes",
    );
  });
});
