import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  parseTwilioFormBody,
  validateTwilioSignature,
} from "@/lib/twilio-webhook";

function signTwilio(
  authToken: string,
  url: string,
  params: Record<string, string>,
) {
  const sortedKeys = Object.keys(params).sort();
  let payload = url;
  for (const key of sortedKeys) {
    payload += key + params[key];
  }
  return createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
}

describe("parseTwilioFormBody", () => {
  it("parses urlencoded form fields", () => {
    const params = parseTwilioFormBody("From=whatsapp%3A%2B34123&Body=Hola");
    expect(params.From).toBe("whatsapp:+34123");
    expect(params.Body).toBe("Hola");
  });
});

describe("validateTwilioSignature", () => {
  it("accepts signatures produced with the same algorithm", () => {
    const authToken = "test-auth-token";
    const url = "https://example.com/api/agent/webhooks/whatsapp?venueSlug=demo";
    const params = { Body: "Hola", From: "whatsapp:+34123456789" };
    const signature = signTwilio(authToken, url, params);
    expect(validateTwilioSignature(authToken, signature, url, params)).toBe(
      true,
    );
  });

  it("rejects tampered payloads", () => {
    const authToken = "test-auth-token";
    const url = "https://example.com/webhook";
    const params = { Body: "Hola" };
    const signature = signTwilio(authToken, url, params);
    expect(
      validateTwilioSignature(authToken, signature, url, {
        Body: "Adiós",
      }),
    ).toBe(false);
  });
});
