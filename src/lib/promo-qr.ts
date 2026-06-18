import { appBaseUrl } from "@/lib/google";

export function buildPromoBookUrl(slug: string, code: string): string {
  const base = appBaseUrl().replace(/\/$/, "");
  return `${base}/book/${slug}?promo=${encodeURIComponent(code)}`;
}
