import { createHmac, timingSafeEqual } from "crypto";

export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  const sortedKeys = Object.keys(params).sort();
  let payload = url;
  for (const key of sortedKeys) {
    payload += key + params[key];
  }

  const expected = createHmac("sha1", authToken)
    .update(payload, "utf8")
    .digest("base64");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseTwilioFormBody(body: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of body.split("&")) {
    const [rawKey, rawValue = ""] = pair.split("=");
    if (!rawKey) continue;
    params[decodeURIComponent(rawKey)] = decodeURIComponent(
      rawValue.replace(/\+/g, " "),
    );
  }
  return params;
}
