import { describe, expect, it } from "vitest";
import { resolveIntegrationStatus } from "./status-service";
import type { IntegrationDefinition } from "./catalog";

const baseCtx = {
  venue: {
    slug: "demo",
    instagramUrl: "https://instagram.com/demo",
    tripAdvisorUrl: null,
    theForkUrl: null,
    tiktokUrl: null,
    isListedOnMarketplace: true,
  },
  posIntegrations: [
    {
      id: "1",
      venueId: "v1",
      provider: "SQUARE" as const,
      status: "CONNECTED" as const,
      credentials: {},
      externalLocationId: null,
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  env: { resend: true, twilio: false },
};

describe("resolveIntegrationStatus", () => {
  it("returns CONNECTED for active POS", () => {
    const def: IntegrationDefinition = {
      slug: "square",
      name: "Square",
      category: "tpv",
      description: "",
      color: "#000",
      connectable: true,
      posProvider: "SQUARE",
    };
    expect(resolveIntegrationStatus(def, baseCtx)).toBe("CONNECTED");
  });

  it("returns ACTIVE when profile field is set", () => {
    const def: IntegrationDefinition = {
      slug: "instagram",
      name: "Instagram",
      category: "social",
      description: "",
      color: "#000",
      profileField: "instagramUrl",
    };
    expect(resolveIntegrationStatus(def, baseCtx)).toBe("ACTIVE");
  });

  it("returns AVAILABLE for always-on channels", () => {
    const def: IntegrationDefinition = {
      slug: "widget",
      name: "Widget",
      category: "external_channels",
      description: "",
      color: "#000",
      alwaysAvailable: true,
    };
    expect(resolveIntegrationStatus(def, baseCtx)).toBe("AVAILABLE");
  });

  it("returns AVAILABLE for connectable POS not yet connected", () => {
    const def: IntegrationDefinition = {
      slug: "holded",
      name: "Holded",
      category: "tpv",
      description: "",
      color: "#000",
      connectable: true,
      posProvider: "HOLDED",
    };
    expect(resolveIntegrationStatus(def, baseCtx)).toBe("AVAILABLE");
  });

  it("returns ACTIVE when theForkUrl is set", () => {
    const def: IntegrationDefinition = {
      slug: "thefork",
      name: "TheFork",
      category: "social",
      description: "",
      color: "#000",
      profileField: "theForkUrl",
    };
    expect(
      resolveIntegrationStatus(def, {
        ...baseCtx,
        venue: { ...baseCtx.venue, theForkUrl: "https://thefork.es/r/demo" },
      }),
    ).toBe("ACTIVE");
  });

  it("returns ACTIVE when tiktokUrl is set", () => {
    const def: IntegrationDefinition = {
      slug: "tiktok",
      name: "TikTok",
      category: "social",
      description: "",
      color: "#000",
      profileField: "tiktokUrl",
    };
    expect(
      resolveIntegrationStatus(def, {
        ...baseCtx,
        venue: { ...baseCtx.venue, tiktokUrl: "https://tiktok.com/@demo" },
      }),
    ).toBe("ACTIVE");
  });

  it("returns COMING_SOON for unconfigured integrations", () => {
    const def: IntegrationDefinition = {
      slug: "opentable",
      name: "OpenTable",
      category: "external_channels",
      description: "",
      color: "#000",
    };
    expect(resolveIntegrationStatus(def, baseCtx)).toBe("COMING_SOON");
  });
});
