import { describe, expect, it } from "vitest";
import { agentRateLimit } from "./rate-limit";

describe("agentRateLimit", () => {
  it("uses agent-scoped keys per venue and channel", () => {
    const first = agentRateLimit("venue-a", "internal", 2, 60_000);
    expect(first.success).toBe(true);

    const second = agentRateLimit("venue-a", "internal", 2, 60_000);
    expect(second.success).toBe(true);

    const third = agentRateLimit("venue-a", "internal", 2, 60_000);
    expect(third.success).toBe(false);
  });

  it("isolates limits by channel", () => {
    const web = agentRateLimit("venue-b", "web", 1, 60_000);
    const phone = agentRateLimit("venue-b", "phone", 1, 60_000);
    expect(web.success).toBe(true);
    expect(phone.success).toBe(true);
  });
});
